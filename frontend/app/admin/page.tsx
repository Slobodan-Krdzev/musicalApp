'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { AdminEventDetailModal } from '@/components/admin/AdminEventDetailModal';
import { AdminSupportPanel } from '@/components/admin/AdminSupportPanel';
import { AdminFreePassModal, formatPlanLabel } from '@/components/admin/AdminFreePassModal';

type AdminTab = 'overview' | 'customers' | 'deals' | 'newsletter' | 'subscriptions' | 'events' | 'applications' | 'support';

type Stats = {
  totalUsers: number;
  musicians: number;
  venues: number;
  activeSubscriptions: number;
  events: number;
  offerings: number;
  applications: number;
  deals: number;
  completedDeals: number;
  newsletterSubscribers: number;
  platformRevenue: number;
  dealsByStatus: Record<string, { count: number; revenue: number }>;
  openSupportTickets: number;
};

type Customer = {
  _id: string;
  email: string;
  role: string;
  isSuspended?: boolean;
  isEmailVerified?: boolean;
  hasCompletedProfile?: boolean;
  displayName: string;
  profileId: string;
  eventsCount: number;
  offeringsCount: number;
  completedDeals: number;
  revenue: number;
  spend: number;
  subscription: {
    planId: string;
    status: string;
    currentPeriodEnd?: string;
    freePassActive?: boolean;
    adminNote?: string | null;
  } | null;
  createdAt: string;
};

type SearchResults = {
  users: Customer[];
  events: Array<{ _id: string; title: string; status: string; date?: string }>;
  offerings: Array<{ _id: string; title: string; status: string }>;
  deals: Array<{ _id: string; status: string; agreedQuote?: number; musicianName?: string; venueName?: string }>;
  subscribers: Array<{ _id: string; email: string; source?: string }>;
};

type DealAdminRow = {
  _id: string;
  entity?: { title?: string; date?: string };
  musicianName: string;
  venueName: string;
  agreedQuote?: number;
  status: string;
  createdAt: string;
};

type DealsAdminResponse = {
  deals: DealAdminRow[];
  stats: { completedRevenue: number; last30Days: number };
};

type AdminEventRow = {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  activeTo?: string;
  status: string;
  venueId?: { email?: string; _id?: string };
};

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'customers', label: 'Customers' },
  { key: 'deals', label: 'Deals' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'events', label: 'Events' },
  { key: 'applications', label: 'Applications' },
  { key: 'support', label: 'Support' },
];

function formatMoney(n: number) {
  return `€${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<AdminTab>(
    initialTab && TABS.some((t) => t.key === initialTab) ? (initialTab as AdminTab) : 'overview'
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dealStatusFilter, setDealStatusFilter] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [grantTarget, setGrantTarget] = useState<{ userId: string; email: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ userId: string; email: string } | null>(null);
  const [freePassError, setFreePassError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiRequest<{ stats: Stats }>('/api/admin/stats').then((r) => r.stats),
  });

  const { data: searchData, isFetching: searchLoading } = useQuery({
    queryKey: ['admin-search', debouncedSearch],
    queryFn: () =>
      apiRequest<{ results: SearchResults }>(`/api/admin/search?q=${encodeURIComponent(debouncedSearch)}`).then(
        (r) => r.results
      ),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-customers', debouncedSearch, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      params.set('limit', '50');
      return apiRequest<{ customers: Customer[] }>(`/api/admin/customers?${params}`).then((r) => r.customers);
    },
    enabled: tab === 'customers',
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['admin-deals', debouncedSearch, dealStatusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (dealStatusFilter !== 'ALL') params.set('status', dealStatusFilter);
      params.set('limit', '50');
      return apiRequest<DealsAdminResponse>(`/api/admin/deals?${params}`);
    },
    enabled: tab === 'deals',
  });

  const { data: newsletterStats } = useQuery({
    queryKey: ['admin-newsletter-stats'],
    queryFn: () => apiRequest<{ stats: { total: number; last30Days: number; bySource: Record<string, number> } }>('/api/admin/newsletter/stats').then((r) => r.stats),
    enabled: tab === 'newsletter',
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ['admin-newsletter-subscribers', debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      params.set('limit', '100');
      return apiRequest<{ subscribers: Array<{ _id: string; email: string; source?: string; emailVerified?: boolean | null; createdAt: string }> }>(
        `/api/admin/newsletter/subscribers?${params}`
      ).then((r) => r.subscribers);
    },
    enabled: tab === 'newsletter',
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-subscriptions', debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      return apiRequest<{ subscriptions: unknown[] }>(`/api/admin/subscriptions?${params}`).then((r) => r.subscriptions);
    },
    enabled: tab === 'subscriptions',
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events', debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      params.set('limit', '50');
      return apiRequest<{ events: AdminEventRow[] }>(`/api/admin/events?${params}`).then((r) => r.events);
    },
    enabled: tab === 'events',
  });

  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['admin-applications', debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      params.set('limit', '50');
      return apiRequest<{ applications: unknown[] }>(`/api/admin/applications?${params}`).then((r) => r.applications);
    },
    enabled: tab === 'applications',
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/users/${id}/suspend`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/users/${id}/unsuspend`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] }),
  });

  const cancelSubMutation = useMutation({
    mutationFn: (userId: string) => apiRequest(`/api/admin/subscriptions/${userId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
  });

  const grantFreePassMutation = useMutation({
    mutationFn: ({ userId, endDate, note }: { userId: string; endDate: string; note?: string }) =>
      apiRequest(`/api/admin/subscriptions/${userId}/free-pass`, {
        method: 'POST',
        body: JSON.stringify({ endDate, note: note || undefined }),
      }),
    onSuccess: () => {
      setGrantTarget(null);
      setFreePassError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: Error) => setFreePassError(err.message),
  });

  const revokeFreePassMutation = useMutation({
    mutationFn: ({ userId, note }: { userId: string; note?: string }) =>
      apiRequest(`/api/admin/subscriptions/${userId}/revoke-free-pass`, {
        method: 'POST',
        body: JSON.stringify({ note: note || undefined }),
      }),
    onSuccess: () => {
      setRevokeTarget(null);
      setFreePassError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: Error) => setFreePassError(err.message),
  });

  const removeSubscriberMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/newsletter/subscribers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const showGlobalSearch = debouncedSearch.length >= 2;

  return (
    <div className="space-y-5 sm:space-y-6">
      <AdminEventDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
      {grantTarget && (
        <AdminFreePassModal
          mode="grant"
          open
          userEmail={grantTarget.email}
          loading={grantFreePassMutation.isPending}
          error={freePassError}
          onClose={() => {
            setGrantTarget(null);
            setFreePassError(null);
          }}
          onSubmit={({ endDate, note }) =>
            grantFreePassMutation.mutate({ userId: grantTarget.userId, endDate, note: note || undefined })
          }
        />
      )}
      {revokeTarget && (
        <AdminFreePassModal
          mode="revoke"
          open
          userEmail={revokeTarget.email}
          loading={revokeFreePassMutation.isPending}
          error={freePassError}
          onClose={() => {
            setRevokeTarget(null);
            setFreePassError(null);
          }}
          onSubmit={({ note }) =>
            revokeFreePassMutation.mutate({ userId: revokeTarget.userId, note: note || undefined })
          }
        />
      )}

      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Admin Dashboard</h1>
          <p className="hidden sm:block text-sm text-zinc-500 mt-1">Platform overview, customers, deals, and newsletter — superadmin only.</p>
        </div>
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search users, events, deals, emails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search admin data"
          />
        </div>
      </div>

      {showGlobalSearch && (
        <Card className="border-violet-500/30">
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">
              Search results {searchLoading ? '…' : ''} for &ldquo;{debouncedSearch}&rdquo;
            </h2>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {searchData && (
              <>
                {searchData.users?.length > 0 && (
                  <SearchSection title="Users" onViewAll={() => setTab('customers')}>
                    {searchData.users.slice(0, 5).map((u) => (
                      <SearchRow key={u._id} label={u.displayName || u.email} meta={`${u.role} · ${u.email}`} href={`/profile/${u._id}`} />
                    ))}
                  </SearchSection>
                )}
                {searchData.events?.length > 0 && (
                  <SearchSection title="Events" onViewAll={() => setTab('events')}>
                    {searchData.events.slice(0, 5).map((e) => (
                      <SearchRow
                        key={e._id}
                        label={e.title}
                        meta={`${e.status}${e.date ? ` · ${formatDate(e.date)}` : ''}`}
                        onClick={() => setSelectedEventId(e._id)}
                      />
                    ))}
                  </SearchSection>
                )}
                {searchData.deals?.length > 0 && (
                  <SearchSection title="Deals" onViewAll={() => setTab('deals')}>
                    {searchData.deals.slice(0, 5).map((d: { _id: string; agreedQuote?: number; status: string; musicianName?: string; venueName?: string }) => (
                      <SearchRow key={d._id} label={`${d.musicianName || 'Musician'} ↔ ${d.venueName || 'Venue'}`} meta={`${d.status}${d.agreedQuote != null ? ` · ${formatMoney(d.agreedQuote)}` : ''}`} />
                    ))}
                  </SearchSection>
                )}
                {searchData.subscribers?.length > 0 && (
                  <SearchSection title="Newsletter" onViewAll={() => setTab('newsletter')}>
                    {searchData.subscribers.slice(0, 5).map((s) => (
                      <SearchRow key={s._id} label={s.email} meta={s.source || 'homepage'} />
                    ))}
                  </SearchSection>
                )}
                {!searchData.users?.length && !searchData.deals?.length && !searchData.events?.length && !searchData.offerings?.length && !searchData.subscribers?.length && (
                  <p className="text-zinc-500">No matches found.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="-mx-3 sm:-mx-4 lg:-mx-8 overflow-x-auto border-b border-zinc-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-1.5 px-3 pb-3 sm:gap-2 sm:px-4 sm:pb-4 lg:px-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm ${
                tab === t.key ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total customers" value={stats.totalUsers} />
            <StatCard label="Musicians" value={stats.musicians} />
            <StatCard label="Venues" value={stats.venues} />
            <StatCard label="Active subscriptions" value={stats.activeSubscriptions} />
            <StatCard label="Events" value={stats.events} />
            <StatCard label="Offerings" value={stats.offerings} />
            <StatCard label="Applications" value={stats.applications} />
            <StatCard label="Deals (completed)" value={`${stats.completedDeals} / ${stats.deals}`} />
            <StatCard label="Platform gig revenue" value={formatMoney(stats.platformRevenue)} />
            <StatCard label="Newsletter subscribers" value={stats.newsletterSubscribers} />
            <StatCard label="Open support tickets" value={stats.openSupportTickets ?? 0} />
          </div>
          {stats.dealsByStatus && (
            <Card>
              <CardHeader><h2 className="font-semibold text-zinc-100">Deals by status</h2></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.dealsByStatus).map(([status, data]) => (
                    <div key={status} className="rounded-lg bg-zinc-800/50 p-3">
                      <Badge className="mb-2">{status}</Badge>
                      <p className="text-zinc-300">{data.count} deals</p>
                      <p className="text-emerald-400 text-sm">{formatMoney(data.revenue)} quoted</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {['ALL', 'MUSICIAN', 'VENUE'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:py-1.5 sm:text-xs ${roleFilter === r ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {r === 'ALL' ? 'All roles' : r}
              </button>
            ))}
          </div>
          <DataTable
            loading={customersLoading}
            headers={['Customer', 'Role', 'Events / Offerings', 'Deals', 'Revenue', 'Subscription', 'Status', 'Links', 'Actions']}
            empty="No customers found."
          >
            {(customersData || []).map((u) => (
              <tr key={u._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                <td className="py-3 pr-4">
                  <p className="font-medium text-zinc-200">{u.displayName}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className="py-3"><Badge>{u.role}</Badge></td>
                <td className="py-3 text-zinc-400 text-xs">
                  {u.role === 'VENUE' ? `${u.eventsCount} events` : u.role === 'MUSICIAN' ? `${u.offeringsCount} offerings` : '—'}
                </td>
                <td className="py-3 text-zinc-300">{u.completedDeals}</td>
                <td className="py-3 text-emerald-400 text-sm">
                  {u.revenue > 0 && formatMoney(u.revenue)}
                  {u.spend > 0 && <span className="block text-zinc-500">spent {formatMoney(u.spend)}</span>}
                  {!u.revenue && !u.spend && '—'}
                </td>
                <td className="py-3 text-xs text-zinc-400">
                  {u.subscription ? (
                    <>
                      <Badge variant={u.subscription.status === 'active' || u.subscription.status === 'trialing' ? 'success' : 'default'}>
                        {formatPlanLabel(u.subscription.planId, u.subscription.freePassActive)}
                      </Badge>
                      <span className="block mt-1">{u.subscription.status}</span>
                      {u.subscription.freePassActive && u.subscription.currentPeriodEnd && (
                        <span className="block mt-1 text-zinc-500">until {formatDate(u.subscription.currentPeriodEnd)}</span>
                      )}
                    </>
                  ) : '—'}
                </td>
                <td className="py-3">
                  {u.isSuspended ? <Badge variant="danger">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                </td>
                <td className="py-3">
                  <Link href={`/profile/${u.profileId}`} className="text-violet-400 hover:text-violet-300 text-xs">Profile</Link>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {u.isSuspended ? (
                      <Button size="sm" variant="secondary" onClick={() => unsuspendMutation.mutate(u._id)}>Unsuspend</Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => suspendMutation.mutate(u._id)}>Suspend</Button>
                    )}
                    {u.subscription?.freePassActive ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRevokeTarget({ userId: u._id, email: u.email })}
                      >
                        Revoke pass
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setGrantTarget({ userId: u._id, email: u.email })}
                      >
                        Free Pass
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {tab === 'deals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDealStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dealStatusFilter === s ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {s === 'ALL' ? 'All statuses' : s}
              </button>
            ))}
          </div>
          {dealsData?.stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Completed revenue" value={formatMoney(dealsData.stats.completedRevenue)} />
              <StatCard label="Deals (30 days)" value={dealsData.stats.last30Days} />
            </div>
          ) : null}
          <DataTable loading={dealsLoading} headers={['Gig', 'Musician', 'Venue', 'Quote', 'Status', 'Date']} empty="No deals found.">
            {(dealsData?.deals || []).map((d) => (
              <tr key={d._id} className="border-b border-zinc-800/50">
                <td className="py-3 text-zinc-200">{d.entity?.title || '—'}</td>
                <td className="py-3 text-zinc-400 text-sm">{d.musicianName}</td>
                <td className="py-3 text-zinc-400 text-sm">{d.venueName}</td>
                <td className="py-3 text-emerald-400">{d.agreedQuote != null ? formatMoney(d.agreedQuote) : '—'}</td>
                <td className="py-3"><Badge variant={d.status === 'COMPLETED' ? 'success' : 'default'}>{d.status}</Badge></td>
                <td className="py-3 text-zinc-500 text-xs">{formatDate(d.entity?.date || d.createdAt)}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {tab === 'newsletter' && (
        <div className="space-y-4">
          {newsletterStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total subscribers" value={newsletterStats.total} />
              <StatCard label="Last 30 days" value={newsletterStats.last30Days} />
              {Object.entries(newsletterStats.bySource || {}).map(([source, count]) => (
                <StatCard key={source} label={`Source: ${source}`} value={count} />
              ))}
            </div>
          )}
          <DataTable loading={subscribersLoading} headers={['Email', 'Source', 'Verified', 'Subscribed', 'Actions']} empty="No subscribers found.">
            {(subscribersData || []).map((s) => (
              <tr key={s._id} className="border-b border-zinc-800/50">
                <td className="py-3 text-zinc-200">{s.email}</td>
                <td className="py-3"><Badge>{s.source || 'homepage'}</Badge></td>
                <td className="py-3">
                  <Badge variant={s.emailVerified === false ? 'default' : 'success'}>
                    {s.emailVerified === false ? 'Pending' : 'Yes'}
                  </Badge>
                </td>
                <td className="py-3 text-zinc-500 text-sm">{formatDate(s.createdAt)}</td>
                <td className="py-3">
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={removeSubscriberMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove ${s.email} from the party newsletter?`)) {
                        removeSubscriberMutation.mutate(s._id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {tab === 'subscriptions' && (
        <DataTable loading={subsLoading} headers={['User', 'Plan', 'Status', 'Period end', 'Note', 'Actions']} empty="No subscriptions.">
          {((Array.isArray(subsData) ? subsData : []) as Array<{
            _id?: string;
            userId?: { _id?: string; email?: string } | string;
            planId?: string;
            status?: string;
            currentPeriodEnd?: string;
            freePassActive?: boolean;
            adminNote?: string | null;
          }>).map((s) => {
            const userId = typeof s.userId === 'object' && s.userId !== null && '_id' in s.userId ? s.userId._id : (s.userId as string);
            const email = typeof s.userId === 'object' && s.userId !== null && 'email' in s.userId ? (s.userId as { email?: string }).email : '—';
            return (
              <tr key={s._id || userId} className="border-b border-zinc-800/50">
                <td className="py-3 text-zinc-300">{email}</td>
                <td className="py-3"><Badge>{formatPlanLabel(s.planId, s.freePassActive)}</Badge></td>
                <td className="py-3"><Badge variant={s.status === 'active' || s.status === 'trialing' ? 'success' : 'default'}>{s.status}</Badge></td>
                <td className="py-3 text-zinc-500 text-sm">{formatDate(s.currentPeriodEnd)}</td>
                <td className="py-3 text-zinc-500 text-xs max-w-[200px] truncate" title={s.adminNote || undefined}>
                  {s.adminNote || '—'}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {s.freePassActive ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => userId && email && setRevokeTarget({ userId, email })}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => userId && email && setGrantTarget({ userId, email })}
                        >
                          Free Pass
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => userId && cancelSubMutation.mutate(userId)}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {tab === 'events' && (
        <div className="space-y-3">
          {eventsLoading ? (
            <Card><CardContent className="p-6 text-sm text-zinc-500">Loading…</CardContent></Card>
          ) : !(eventsData || []).length ? (
            <Card><CardContent className="p-6 text-sm text-zinc-500">No events found.</CardContent></Card>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {(eventsData || []).map((e) => (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() => setSelectedEventId(e._id)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-800/40 active:bg-zinc-800/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-100 truncate">{e.title}</p>
                        <p className="mt-1 text-xs text-zinc-500 truncate">{e.venueId?.email || 'Unknown venue'}</p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDate(e.date)}</p>
                      </div>
                      <Badge>{e.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-violet-400">Tap for details</p>
                  </button>
                ))}
              </div>

              <div className="hidden md:block">
                <DataTable loading={false} headers={['Title', 'Venue', 'Date', 'Status']} empty="No events found.">
                  {(eventsData || []).map((e) => (
                    <tr
                      key={e._id}
                      onClick={() => setSelectedEventId(e._id)}
                      className="border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-3 sm:px-4 text-zinc-200">{e.title}</td>
                      <td className="py-3 px-3 sm:px-4 text-zinc-500 text-sm">{e.venueId?.email || '—'}</td>
                      <td className="py-3 px-3 sm:px-4 text-zinc-500 text-sm">{formatDate(e.date)}</td>
                      <td className="py-3 px-3 sm:px-4"><Badge>{e.status}</Badge></td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <DataTable loading={applicationsLoading} headers={['Listing', 'Applicant', 'Owner', 'Quote', 'Status', 'Applied']} empty="No applications found.">
          {((applicationsData || []) as Array<{
            _id: string;
            entity?: { title?: string };
            applicantId?: { email?: string };
            ownerId?: { email?: string };
            quote?: number;
            status: string;
            createdAt: string;
          }>).map((a) => (
            <tr key={a._id} className="border-b border-zinc-800/50">
              <td className="py-3 text-zinc-200">{a.entity?.title || '—'}</td>
              <td className="py-3 text-zinc-500 text-sm">{a.applicantId?.email || '—'}</td>
              <td className="py-3 text-zinc-500 text-sm">{a.ownerId?.email || '—'}</td>
              <td className="py-3 text-emerald-400">{a.quote != null ? formatMoney(a.quote) : '—'}</td>
              <td className="py-3"><Badge variant={a.status === 'FINALIZED' || a.status === 'ACCEPTED' ? 'success' : a.status === 'PENDING' ? 'warning' : 'default'}>{a.status}</Badge></td>
              <td className="py-3 text-zinc-500 text-xs">{formatDate(a.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {tab === 'support' && <AdminSupportPanel />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <p className="text-zinc-400 text-xs sm:text-sm leading-snug">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-zinc-100 mt-1 break-words">{value}</p>
      </CardContent>
    </Card>
  );
}

function DataTable({
  headers,
  children,
  loading,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  empty: string;
}) {
  const rows = Array.isArray(children) ? children : children ? [children] : [];
  const hasRows = rows.some((r) => r);

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <p className="p-6 text-zinc-500 text-sm">Loading…</p>
        ) : !hasRows ? (
          <p className="p-6 text-zinc-500 text-sm">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  {headers.map((h) => (
                    <th key={h} className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="px-4">{children}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SearchSection({ title, children, onViewAll }: { title: string; children: React.ReactNode; onViewAll: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</span>
        <button type="button" onClick={onViewAll} className="text-xs text-violet-400 hover:text-violet-300">View all</button>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SearchRow({
  label,
  meta,
  href,
  onClick,
}: {
  label: string;
  meta?: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="text-zinc-200">{label}</span>
      {meta && <span className="text-zinc-500 ml-2">{meta}</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block rounded-lg px-2 py-1.5 hover:bg-zinc-800/50">
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-zinc-800/50"
      >
        {content}
      </button>
    );
  }
  return <div className="rounded-lg px-2 py-1.5">{content}</div>;
}
