'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type Stats = {
  totalUsers: number;
  musicians: number;
  venues: number;
  activeSubscriptions: number;
  events: number;
  applications: number;
  deals: number;
  revenue: number | null;
};

type UserRow = { _id: string; email: string; role: string; isSuspended?: boolean };

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'stats' | 'users' | 'events' | 'applications' | 'deals' | 'subscriptions'>('stats');

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiRequest<{ stats: Stats }>('/api/admin/stats').then((r) => r.stats),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<{ users: UserRow[] }>('/api/admin/users').then((r) => r.users),
    enabled: tab === 'users',
  });
  const users = Array.isArray(usersData) ? usersData : [];

  const { data: eventsData } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => apiRequest<{ events: unknown[] }>('/api/admin/events').then((r) => r.events),
    enabled: tab === 'events',
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => apiRequest<{ applications: unknown[] }>('/api/admin/applications').then((r) => r.applications),
    enabled: tab === 'applications',
  });

  const { data: dealsData } = useQuery({
    queryKey: ['admin-deals'],
    queryFn: () => apiRequest<{ deals: unknown[] }>('/api/admin/deals').then((r) => r.deals),
    enabled: tab === 'deals',
  });

  const { data: subsData } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => apiRequest<{ subscriptions: unknown[] }>('/api/admin/subscriptions').then((r) => r.subscriptions),
    enabled: tab === 'subscriptions',
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/users/${id}/suspend`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/users/${id}/unsuspend`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const cancelSubMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/admin/subscriptions/${userId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">SuperAdmin Dashboard</h1>

      <div className="-mx-3 sm:-mx-4 lg:-mx-8 overflow-x-auto border-b border-zinc-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-2 px-3 pb-4 sm:px-4 lg:px-8">
          {(['stats', 'users', 'events', 'applications', 'deals', 'subscriptions'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                tab === t ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Musicians</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.musicians}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Venues</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.venues}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Active Subscriptions</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.activeSubscriptions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Events</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.events}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Applications</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.applications}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Deals</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.deals}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">Users</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-400 border-b border-zinc-800">
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-300">{u.email}</td>
                      <td className="py-2"><Badge>{u.role}</Badge></td>
                      <td className="py-2">
                        {u.isSuspended ? <Badge variant="danger">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                      </td>
                      <td className="py-2">
                        {u.isSuspended ? (
                          <Button size="sm" variant="secondary" onClick={() => unsuspendMutation.mutate(u._id)}>
                            Unsuspend
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => suspendMutation.mutate(u._id)}>
                            Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'events' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">Events</h2>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-400 overflow-auto max-h-96">
              {JSON.stringify(eventsData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {tab === 'applications' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">Applications</h2>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-400 overflow-auto max-h-96">
              {JSON.stringify(applicationsData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {tab === 'deals' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">Deals</h2>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-400 overflow-auto max-h-96">
              {JSON.stringify(dealsData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {tab === 'subscriptions' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">Subscriptions</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-400 border-b border-zinc-800">
                    <th className="py-2">User</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Period end</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {((Array.isArray(subsData) ? subsData : []) as Array<{ _id?: string; userId?: { _id?: string; email?: string } | string; planId?: string; status?: string; currentPeriodEnd?: string }>).map((s) => {
                    const userId = typeof s.userId === 'object' && s.userId !== null && '_id' in s.userId ? s.userId._id : (s.userId as string);
                    const email = typeof s.userId === 'object' && s.userId !== null && 'email' in s.userId ? (s.userId as { email?: string }).email : '—';
                    return (
                      <tr key={s._id || userId} className="border-b border-zinc-800/50">
                        <td className="py-2 text-zinc-300">{email}</td>
                        <td className="py-2"><Badge>{s.planId}</Badge></td>
                        <td className="py-2"><Badge>{s.status}</Badge></td>
                        <td className="py-2 text-zinc-400">
                          {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => userId && cancelSubMutation.mutate(userId)}
                          >
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
