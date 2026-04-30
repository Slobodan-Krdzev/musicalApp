'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// ── Types ──

type Notif = {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
  relatedEntityModel?: string;
};

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  activeTo?: string;
  lookingFor?: string[];
  approximatePayment?: number;
  paymentType?: string;
  status: string;
};

type OfferingItem = {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  activeTo?: string;
  lookingFor?: string[];
  approximatePrice?: number;
  paymentType?: string;
  genres?: string[];
  interests?: string[];
  status: string;
};

type CalendarItem = {
  _id: string;
  title: string;
  date?: string;
  status: string;
  description?: string;
};

type ApplicationItem = {
  _id: string;
  entityType: 'EVENT' | 'OFFERING';
  entityId: string;
  applicantId: string;
  ownerId: string;
  quote?: number;
  message?: string;
  status: string;
  createdAt: string;
  entity?: { _id: string; title: string; date?: string; status: string };
};

type Sub = {
  planId: string;
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
};

type MusicianProfile = {
  bandName?: string;
  bio?: string;
  genres?: string[];
  services?: string[];
  location?: { city?: string; region?: string; country?: string };
  interests?: string[];
  expectationsFromApp?: string[];
  avatarUrl?: string;
  images?: string[];
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; spotify?: string };
  contactPhone?: string;
  paymentPreferences?: string;
};

type VenueProfile = {
  venueName?: string;
  description?: string;
  capacity?: number;
  location?: { address?: string; city?: string; region?: string; country?: string; latitude?: number; longitude?: number };
  gigTypes?: string[];
  servicesInterestedIn?: string[];
  interests?: string[];
  expectationsFromApp?: string[];
  avatarUrl?: string;
  images?: string[];
  providesAudioEquipment?: boolean;
  audioEquipmentDescription?: string;
  providesSoundEngineer?: boolean;
  providesLightingEquipment?: boolean;
  lightingEquipmentDescription?: string;
  hasDedicatedStage?: boolean;
  stageDescription?: string;
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; spotify?: string };
  contactPhone?: string;
  paymentPreferences?: string;
};

type AnyProfile = MusicianProfile | VenueProfile;

type SidebarTab = 'notifications' | 'events' | 'profile' | 'media' | 'links' | 'subscription';

const SIDEBAR_ITEMS: { key: SidebarTab; label: string }[] = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'events', label: 'My Events' },
  { key: 'profile', label: 'My Profile' },
  { key: 'media', label: 'Media' },
  { key: 'links', label: 'Links' },
  { key: 'subscription', label: 'Subscription & Billing' },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

// ── SVG Icons ──

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.758a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.81" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

const SIDEBAR_ICONS: Record<SidebarTab, (props: { className?: string }) => JSX.Element> = {
  notifications: BellIcon,
  events: CalendarIcon,
  profile: UserIcon,
  media: PhotoIcon,
  links: LinkIcon,
  subscription: CreditCardIcon,
};

// ── Main Dashboard ──

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SidebarTab>('notifications');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const isVenue = user?.role === 'VENUE';
  const isMusician = user?.role === 'MUSICIAN';

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [createEventDate, setCreateEventDate] = useState('');
  const [showCreateOffering, setShowCreateOffering] = useState(false);
  const [createOfferingDate, setCreateOfferingDate] = useState('');

  // ── Queries ──

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => apiRequest<{ profile: AnyProfile | null }>('/api/users/me/profile'),
    enabled: !!user,
  });

  const profile = profileData?.profile;

  const { data: notifsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<{ notifications: Notif[]; unreadCount: number }>('/api/notifications?limit=50'),
    enabled: !!user,
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiRequest<{ subscription: Sub | null }>('/api/users/me/subscription').then((r) => r.subscription),
    enabled: !!user,
  });

  const { data: myEvents } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => apiRequest<{ events: EventItem[] }>('/api/events/my').then((r) => r.events),
    enabled: !!user && isVenue,
  });

  const { data: myOfferings } = useQuery({
    queryKey: ['my-offerings'],
    queryFn: () => apiRequest<{ offerings: OfferingItem[] }>('/api/offerings/my').then((r) => r.offerings),
    enabled: !!user && isMusician,
  });

  const { data: myApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => apiRequest<{ applications: ApplicationItem[] }>('/api/applications/my').then((r) => r.applications),
    enabled: !!user,
  });

  // ── Mutations ──

  const updateProfileMutation = useMutation({
    mutationFn: (body: Partial<AnyProfile>) =>
      apiRequest('/api/users/me/profile', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // ── Avatar upload ──

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarUploading(true);
    try {
      const base64 = await readFileAsDataUrl(file);
      const data = await apiRequest<{ url: string }>('/api/upload/image', {
        method: 'POST',
        body: JSON.stringify({ base64 }),
      });
      updateProfileMutation.mutate({ avatarUrl: data.url });
    } catch {
      // silently fail
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  const profileName = profile
    ? 'bandName' in profile
      ? (profile as MusicianProfile).bandName
      : (profile as VenueProfile).venueName
    : '';

  const unreadCount = notifsData?.unreadCount ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Modals – rendered at page root to avoid clipping */}
      {isVenue && (
        <CreateEventModal
          open={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          prefilledDate={createEventDate}
          onCreated={() => {
            setShowCreateEvent(false);
            queryClient.invalidateQueries({ queryKey: ['my-events'] });
          }}
        />
      )}
      {isMusician && (
        <CreateOfferingModal
          open={showCreateOffering}
          onClose={() => setShowCreateOffering(false)}
          prefilledDate={createOfferingDate}
          onCreated={() => {
            setShowCreateOffering(false);
            queryClient.invalidateQueries({ queryKey: ['my-offerings'] });
          }}
        />
      )}

      {/* ── Welcome Header ── */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative group">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 hover:border-violet-500 transition-colors cursor-pointer"
          >
            {profile?.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex items-center justify-center h-full text-zinc-500 text-xl">
                {profileName?.[0]?.toUpperCase() || '?'}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarUploading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              )}
            </div>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg sm:text-2xl font-bold text-zinc-100">
            Welcome back{profileName ? `, ${profileName}` : ''}
          </h1>
          <p className="truncate text-xs sm:text-sm text-zinc-400">{user?.email}</p>
        </div>
      </div>

      {/* Mobile tab bar — horizontal scroll */}
      <nav className="md:hidden -mx-3 sm:-mx-4 overflow-x-auto px-3 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max items-center gap-2">
          {SIDEBAR_ITEMS.map(({ key, label }) => {
            const Icon = SIDEBAR_ICONS[key];
            const isActive = activeTab === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{label}</span>
                  {key === 'notifications' && unreadCount > 0 && (
                    <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex gap-6 md:min-h-[600px]">
        {/* Desktop sidebar */}
        <nav className="hidden md:block w-56 flex-shrink-0">
          <Card className="sticky top-20">
            <CardContent className="p-2">
              <ul className="space-y-1">
                {SIDEBAR_ITEMS.map(({ key, label }) => {
                  const Icon = SIDEBAR_ICONS[key];
                  const isActive = activeTab === key;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-violet-500/15 text-violet-400 shadow-sm'
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{label}</span>
                        {key === 'notifications' && unreadCount > 0 && (
                          <span className="ml-auto bg-violet-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-right-2 duration-200" key={activeTab}>
            {activeTab === 'notifications' && (
              <NotificationsPanel
                notifications={notifsData?.notifications || []}
                unreadCount={unreadCount}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onMarkAllRead={() => markAllReadMutation.mutate()}
              />
            )}
            {activeTab === 'events' && (
              <EventsPanel
                events={myEvents || []}
                offerings={myOfferings || []}
                applications={myApplications || []}
                isVenue={!!isVenue}
                isMusician={!!isMusician}
                onCreateEvent={(prefilledDate) => {
                  setCreateEventDate(prefilledDate || '');
                  setShowCreateEvent(true);
                }}
                onCreateOffering={(prefilledDate) => {
                  setCreateOfferingDate(prefilledDate || '');
                  setShowCreateOffering(true);
                }}
              />
            )}
            {activeTab === 'profile' && (
              <ProfilePanel
                profile={profile}
                isMusician={!!isMusician}
                isVenue={!!isVenue}
                isLoading={profileLoading}
                onUpdate={(data) => updateProfileMutation.mutate(data)}
                isUpdating={updateProfileMutation.isPending}
              />
            )}
            {activeTab === 'media' && (
              <MediaPanel
                profile={profile}
                onUpdate={(data) => updateProfileMutation.mutate(data)}
                isUpdating={updateProfileMutation.isPending}
              />
            )}
            {activeTab === 'links' && (
              <LinksPanel
                profile={profile}
                onUpdate={(data) => updateProfileMutation.mutate(data)}
                isUpdating={updateProfileMutation.isPending}
              />
            )}
            {activeTab === 'subscription' && <SubscriptionPanel sub={subData ?? null} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// NOTIFICATIONS PANEL
// ══════════════════════════════════════

function NotificationsPanel({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notif[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function getNotifAction(n: Notif): { label: string; href: string } | null {
    if (!n.relatedEntityId) return null;
    if (n.relatedEntityModel === 'Application') {
      switch (n.type) {
        case 'APPLICATION_SUBMITTED':
          return { label: 'Review Application', href: `/applications/${n.relatedEntityId}/review` };
        case 'APPLICATION_ACCEPTED':
          return { label: 'View Deal', href: `/applications/${n.relatedEntityId}/finalize` };
        case 'APPLICATION_REJECTED':
        case 'APPLICATION_EXPIRED':
          return { label: 'View Details', href: `/applications/${n.relatedEntityId}/review` };
        case 'DEAL_CONFIRMED':
          return { label: 'View Deal', href: `/applications/${n.relatedEntityId}/finalize` };
      }
    }
    if (n.type === 'ENTITY_DEACTIVATED') {
      return { label: 'Go to Dashboard', href: '/dashboard' };
    }
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">Notifications</h2>
          {unreadCount > 0 && <Badge variant="warning">{unreadCount} unread</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead}>Mark all read</Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50 max-h-[500px] overflow-y-auto">
            {notifications.map((n) => {
              const isExpanded = expandedId === n._id;
              const action = getNotifAction(n);
              return (
                <div
                  key={n._id}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-zinc-800/30 ${
                    !n.isRead ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : n._id);
                      if (!n.isRead) onMarkRead(n._id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                        n.isRead ? 'bg-zinc-700' : 'bg-violet-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm transition-all duration-200 ${
                          isExpanded ? 'text-zinc-200' : 'text-zinc-300 line-clamp-2'
                        }`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-zinc-600 flex-shrink-0 mt-1 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && action && (
                    <div className="mt-2 ml-5 pl-3">
                      <Button
                        size="sm"
                        onClick={() => router.push(action.href)}
                      >
                        {action.label}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════
// EVENTS PANEL
// ══════════════════════════════════════

function EventsPanel({
  events,
  offerings,
  applications,
  isVenue,
  isMusician,
  onCreateEvent,
  onCreateOffering,
}: {
  events: EventItem[];
  offerings: OfferingItem[];
  applications: ApplicationItem[];
  isVenue: boolean;
  isMusician: boolean;
  onCreateEvent: (prefilledDate?: string) => void;
  onCreateOffering: (prefilledDate?: string) => void;
}) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [selectedFull, setSelectedFull] = useState<EventItem | OfferingItem | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calendarDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const allItems: CalendarItem[] = isVenue
    ? events.map((e) => ({ _id: e._id, title: e.title, date: e.date, status: e.status, description: e.description }))
    : offerings.map((o) => ({ _id: o._id, title: o.title, date: o.date, status: o.status, description: o.description }));

  const fullMap = new Map<string, EventItem | OfferingItem>();
  if (isVenue) events.forEach((e) => fullMap.set(e._id, e));
  else offerings.forEach((o) => fullMap.set(o._id, o));

  const itemsByDay = new Map<number, CalendarItem[]>();
  for (const item of allItems) {
    if (!item.date) continue;
    const d = new Date(item.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!itemsByDay.has(day)) itemsByDay.set(day, []);
      itemsByDay.get(day)!.push(item);
    }
  }

  function prevMonth() { setCalendarDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCalendarDate(new Date(year, month + 1, 1)); }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': case 'ACCEPTED': return 'bg-emerald-500';
      case 'EXPIRED': case 'PENDING': return 'bg-amber-500';
      case 'CANCELLED': case 'REJECTED': case 'AGREED': return 'bg-blue-500';
      default: return 'bg-zinc-500';
    }
  }

  function getStatusBadge(status: string): 'success' | 'warning' | 'danger' | 'default' {
    switch (status) {
      case 'ACTIVE': case 'ACCEPTED': return 'success';
      case 'EXPIRED': case 'PENDING': return 'warning';
      case 'CANCELLED': case 'REJECTED': return 'danger';
      default: return 'default';
    }
  }

  function handleCalendarDayClick(day: number) {
    const dayItems = itemsByDay.get(day) || [];
    if (dayItems.length > 0) {
      const item = dayItems[0];
      setSelectedItem(item);
      setSelectedFull(fullMap.get(item._id) || null);
    } else {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00`;
      if (isVenue) onCreateEvent(dateStr);
      else onCreateOffering(dateStr);
    }
  }

  function handleItemClick(item: CalendarItem) {
    setSelectedItem(item);
    setSelectedFull(fullMap.get(item._id) || null);
  }

  const entityLabel = isVenue ? 'Event' : 'Offering';

  return (
    <>
      {/* Detail Modal */}
      <Modal open={!!selectedItem} onClose={() => { setSelectedItem(null); setSelectedFull(null); }} title={selectedItem?.title} className="max-w-lg">
        {selectedFull && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadge(selectedFull.status)}>{selectedFull.status}</Badge>
              {selectedFull.date && (
                <span className="text-zinc-400 text-sm">
                  {new Date(selectedFull.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {selectedFull.description && <p className="text-zinc-300 text-sm whitespace-pre-wrap">{selectedFull.description}</p>}
            {'activeTo' in selectedFull && selectedFull.activeTo && (
              <p className="text-zinc-500 text-xs">Active until: {new Date(selectedFull.activeTo).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            )}
            {selectedFull.lookingFor && selectedFull.lookingFor.length > 0 && (
              <div>
                <span className="text-xs text-zinc-500 font-medium">Looking for:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedFull.lookingFor.map((g) => <Badge key={g}>{g}</Badge>)}
                </div>
              </div>
            )}
            {'genres' in selectedFull && selectedFull.genres && selectedFull.genres.length > 0 && (
              <div>
                <span className="text-xs text-zinc-500 font-medium">Genres:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedFull.genres.map((g) => <Badge key={g} variant="warning">{g}</Badge>)}
                </div>
              </div>
            )}
            {'approximatePayment' in selectedFull && selectedFull.approximatePayment != null && (
              <p className="text-zinc-400 text-sm">Payment: ~€{selectedFull.approximatePayment}{selectedFull.paymentType ? ` (${selectedFull.paymentType})` : ''}</p>
            )}
            {'approximatePrice' in selectedFull && selectedFull.approximatePrice != null && (
              <p className="text-zinc-400 text-sm">Price: ~€{selectedFull.approximatePrice}{selectedFull.paymentType ? ` (${selectedFull.paymentType})` : ''}</p>
            )}
            {selectedFull.date && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const d = new Date(selectedFull.date!);
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T12:00`;
                  setSelectedItem(null);
                  setSelectedFull(null);
                  if (isVenue) onCreateEvent(dateStr);
                  else onCreateOffering(dateStr);
                }}
              >
                + Add new {entityLabel.toLowerCase()} on this date
              </Button>
            )}
          </div>
        )}
      </Modal>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{isVenue ? 'My Events' : 'My Offerings'}</h2>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {isVenue && (
              <Button size="sm" onClick={() => onCreateEvent()}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Create Event</span>
                  <span className="sm:hidden">New</span>
                </span>
              </Button>
            )}
            {isMusician && (
              <Button size="sm" onClick={() => onCreateOffering()}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Create Offering</span>
                  <span className="sm:hidden">New</span>
                </span>
              </Button>
            )}
            <div className="flex items-center gap-1.5">
              <button type="button" aria-label="Previous month" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-zinc-200 text-sm font-medium min-w-[120px] sm:min-w-[140px] text-center">{monthName}</span>
              <button type="button" aria-label="Next month" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px mb-1">
            {[
              { full: 'Sun', short: 'S' },
              { full: 'Mon', short: 'M' },
              { full: 'Tue', short: 'T' },
              { full: 'Wed', short: 'W' },
              { full: 'Thu', short: 'T' },
              { full: 'Fri', short: 'F' },
              { full: 'Sat', short: 'S' },
            ].map((d, i) => (
              <div key={i} className="py-2 text-center text-xs font-medium text-zinc-500">
                <span className="sm:hidden">{d.short}</span>
                <span className="hidden sm:inline">{d.full}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 rounded-lg sm:h-16" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayItems = itemsByDay.get(day) || [];
              const hasItems = dayItems.length > 0;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleCalendarDayClick(day)}
                  className={`h-12 sm:h-16 rounded-lg p-1 text-left transition-colors ${
                    isToday(day)
                      ? 'bg-violet-500/10 border border-violet-500/30'
                      : hasItems
                      ? 'bg-zinc-800/50 hover:bg-zinc-800'
                      : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {day}
                  </span>
                  {dayItems.length > 0 && (
                    <>
                      {/* Mobile: status dots only */}
                      <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                        {dayItems.slice(0, 3).map((item) => (
                          <span
                            key={item._id}
                            className={`h-1.5 w-1.5 rounded-full ${getStatusColor(item.status)}`}
                          />
                        ))}
                        {dayItems.length > 3 && (
                          <span className="text-[9px] leading-none text-zinc-500">+{dayItems.length - 3}</span>
                        )}
                      </div>
                      {/* sm+: titles */}
                      <div className="mt-0.5 hidden space-y-0.5 sm:block">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(item.status)}`} />
                            <span className="text-[10px] text-zinc-300 truncate">{item.title}</span>
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <span className="text-[10px] text-zinc-500">+{dayItems.length - 2} more</span>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {allItems.length > 0 && (
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">All {isVenue ? 'Events' : 'Offerings'}</h3>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {allItems.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors text-left"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(item.status)}`} />
                    <span className="text-sm text-zinc-200 flex-1 truncate">{item.title}</span>
                    <Badge variant={getStatusBadge(item.status)}>{item.status}</Badge>
                    {item.date && (
                      <span className="text-xs text-zinc-500">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {allItems.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">
                {isVenue
                  ? 'No events yet. Click a date or the button above to create one.'
                  : 'No offerings yet. Click a date or the button above to create one.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications section */}
      {applications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-100">My Applications</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
              {applications.map((app) => {
                const entityTitle = app.entity?.title || 'Unknown';
                const isApplicant = true;
                const statusBadge: 'success' | 'warning' | 'danger' | 'default' =
                  app.status === 'ACCEPTED' || app.status === 'FINALIZED' ? 'success' :
                  app.status === 'PENDING' ? 'warning' :
                  app.status === 'REJECTED' ? 'danger' : 'default';

                const href = app.status === 'ACCEPTED'
                  ? `/applications/${app._id}/finalize`
                  : `/applications/${app._id}/review`;

                return (
                  <button
                    key={app._id}
                    type="button"
                    onClick={() => router.push(href)}
                    className="w-full text-left px-3 py-3 sm:px-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        app.entityType === 'EVENT' ? 'bg-violet-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{entityTitle}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          {app.entityType === 'EVENT' ? 'Event' : 'Offering'}
                          {app.quote != null && ` · €${app.quote}`}
                          {' · '}
                          {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant={statusBadge} className="flex-shrink-0">{app.status}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ══════════════════════════════════════
// CREATE EVENT MODAL
// ══════════════════════════════════════

function CreateEventModal({
  open,
  onClose,
  prefilledDate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  prefilledDate: string;
  onCreated: () => void;
}) {
  const emptyForm = {
    title: '',
    description: '',
    date: '',
    activeTo: '',
    lookingFor: [] as string[],
    approximatePayment: '',
    paymentType: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, date: prefilledDate || '' });
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefilledDate]);

  function handleFieldChange(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleLookingFor(option: string) {
    setForm((prev) => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter((x) => x !== option)
        : [...prev.lookingFor, option],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.date) { setError('Date and time are required'); return; }
    if (!form.activeTo) { setError('Active To date is required'); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        activeTo: new Date(form.activeTo).toISOString(),
      };
      if (form.lookingFor.length) body.lookingFor = form.lookingFor;
      if (form.approximatePayment) body.approximatePayment = Number(form.approximatePayment);
      if (form.paymentType) body.paymentType = form.paymentType;

      await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  }

  const LOOKING_FOR = [
    'Rock Band', 'Cover Band', 'Original Band', 'Jazz Ensemble', 'Pop Group',
    'Acoustic Act', 'DJ', 'Solo Artist', 'Duo', 'Trio', 'Full Band',
    'Classical Ensemble', 'Blues Band', 'Funk Band', 'Latin Band',
    'Folk Artist', 'Country Band', 'Hip Hop Act', 'Electronic Act',
    'Reggae Band', 'Soul / R&B Act',
  ];

  const PAYMENT_TYPES = ['Cash', 'Bank Transfer', 'Card', 'PayPal', 'Crypto', 'Other'];

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50';

  return (
    <Modal open={open} onClose={onClose} title="Create Event" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs text-zinc-500 font-medium">Title *</label>
          <input className={inputClass} placeholder="Event title" value={form.title} onChange={(e) => handleFieldChange('title', e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-medium">Description *</label>
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Describe the event and what you're looking for..." value={form.description} onChange={(e) => handleFieldChange('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 font-medium">Date & Time *</label>
            <input type="datetime-local" className={inputClass} value={form.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">Active To *</label>
            <input type="datetime-local" className={inputClass} value={form.activeTo} onChange={(e) => handleFieldChange('activeTo', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-medium">Looking For (optional)</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {LOOKING_FOR.map((opt) => {
              const isSelected = form.lookingFor.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleLookingFor(opt)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 font-medium">Approximate Payment (€)</label>
            <input type="number" min="0" className={inputClass} placeholder="e.g. 500" value={form.approximatePayment} onChange={(e) => handleFieldChange('approximatePayment', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">Payment Type</label>
            <select className={inputClass} value={form.paymentType} onChange={(e) => handleFieldChange('paymentType', e.target.value)}>
              <option value="">Select...</option>
              {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">Create Event</Button>
        </div>
      </form>
    </Modal>
  );
}

// ══════════════════════════════════════
// CREATE OFFERING MODAL
// ══════════════════════════════════════

function CreateOfferingModal({
  open,
  onClose,
  prefilledDate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  prefilledDate: string;
  onCreated: () => void;
}) {
  const emptyForm = {
    title: '',
    description: '',
    date: '',
    activeTo: '',
    lookingFor: [] as string[],
    approximatePrice: '',
    paymentType: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, date: prefilledDate || '' });
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefilledDate]);

  function handleFieldChange(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleLookingFor(option: string) {
    setForm((prev) => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter((x) => x !== option)
        : [...prev.lookingFor, option],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.date) { setError('Date and time are required'); return; }
    if (!form.activeTo) { setError('Active To date is required'); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        activeTo: new Date(form.activeTo).toISOString(),
      };
      if (form.lookingFor.length) body.lookingFor = form.lookingFor;
      if (form.approximatePrice) body.approximatePrice = Number(form.approximatePrice);
      if (form.paymentType) body.paymentType = form.paymentType;

      await apiRequest('/api/offerings', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offering');
    } finally {
      setSubmitting(false);
    }
  }

  const LOOKING_FOR = [
    'Wedding Gig', 'Corporate Event', 'Restaurant Gig', 'Bar Gig', 'Festival',
    'Private Party', 'Club Event', 'Hotel Gig', 'Charity Event',
    'Birthday Party', 'Cruise Entertainment', 'Open Mic', 'Studio Session',
  ];

  const PAYMENT_TYPES = ['Cash', 'Bank Transfer', 'Card', 'PayPal', 'Crypto', 'Other'];

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50';

  return (
    <Modal open={open} onClose={onClose} title="Create Offering" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs text-zinc-500 font-medium">Title *</label>
          <input className={inputClass} placeholder="e.g. Available for weekend gig" value={form.title} onChange={(e) => handleFieldChange('title', e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-medium">Description *</label>
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Describe what you offer and the type of gig you're looking for..." value={form.description} onChange={(e) => handleFieldChange('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 font-medium">Date & Time *</label>
            <input type="datetime-local" className={inputClass} value={form.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">Active To *</label>
            <input type="datetime-local" className={inputClass} value={form.activeTo} onChange={(e) => handleFieldChange('activeTo', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-medium">Looking For (optional)</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {LOOKING_FOR.map((opt) => {
              const isSelected = form.lookingFor.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleLookingFor(opt)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 font-medium">Approximate Price (€)</label>
            <input type="number" min="0" className={inputClass} placeholder="e.g. 300" value={form.approximatePrice} onChange={(e) => handleFieldChange('approximatePrice', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">Payment Type</label>
            <select className={inputClass} value={form.paymentType} onChange={(e) => handleFieldChange('paymentType', e.target.value)}>
              <option value="">Select...</option>
              {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <p className="text-xs text-zinc-600">Your genres and interests from your profile will be automatically attached.</p>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">Create Offering</Button>
        </div>
      </form>
    </Modal>
  );
}

// ══════════════════════════════════════
// PROFILE PANEL
// ══════════════════════════════════════

function ProfilePanel({
  profile,
  isMusician,
  isVenue,
  isLoading,
  onUpdate,
  isUpdating,
}: {
  profile: AnyProfile | null | undefined;
  isMusician: boolean;
  isVenue: boolean;
  isLoading: boolean;
  onUpdate: (data: Partial<AnyProfile>) => void;
  isUpdating: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AnyProfile>({});

  function startEdit() {
    setDraft(profile ? { ...profile } : {});
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft({});
  }

  function saveEdit() {
    onUpdate(draft);
    setEditing(false);
  }

  function updateDraft(key: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateDraftLocation(field: string, value: string) {
    setDraft((prev) => ({
      ...prev,
      location: { ...(prev as VenueProfile).location, [field]: value },
    }));
  }

  if (isLoading) {
    return <Card className="animate-pulse h-64" />;
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-zinc-500">No profile data available.</p>
        </CardContent>
      </Card>
    );
  }

  const mp = (editing ? draft : profile) as MusicianProfile;
  const vp = (editing ? draft : profile) as VenueProfile;
  const current = editing ? draft : profile;

  const inputClass = 'w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50';
  const textareaClass = `${inputClass} resize-none`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">My Profile</h2>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={startEdit} className="w-full sm:w-auto">
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </span>
          </Button>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="w-full sm:w-auto">Cancel</Button>
            <Button size="sm" loading={isUpdating} onClick={saveEdit} className="w-full sm:w-auto">Save changes</Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Name & Description */}
        <div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 font-medium">{isMusician ? 'Band / Artist Name' : 'Venue Name'}</label>
                <input
                  className={inputClass}
                  value={isMusician ? mp.bandName || '' : vp.venueName || ''}
                  onChange={(e) => updateDraft(isMusician ? 'bandName' : 'venueName', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-medium">Description</label>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={isMusician ? mp.bio || '' : vp.description || ''}
                  onChange={(e) => updateDraft(isMusician ? 'bio' : 'description', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-zinc-100">
                {isMusician ? mp.bandName || 'Unnamed artist' : vp.venueName || 'Unnamed venue'}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                {isMusician ? mp.bio : vp.description}
              </p>
            </>
          )}
        </div>

        {/* Location */}
        {editing ? (
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Location</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
              <div>
                <label className="text-xs text-zinc-600">City</label>
                <input className={inputClass} value={current.location?.city || ''} onChange={(e) => updateDraftLocation('city', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Region</label>
                <input className={inputClass} value={current.location?.region || ''} onChange={(e) => updateDraftLocation('region', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Country</label>
                <input className={inputClass} value={current.location?.country || ''} onChange={(e) => updateDraftLocation('country', e.target.value)} />
              </div>
            </div>
          </div>
        ) : (
          current.location && (
            <InfoRow
              label="Location"
              value={[current.location.city, current.location.region, current.location.country].filter(Boolean).join(', ')}
            />
          )
        )}

        {/* Genres / Services */}
        {isMusician && (
          <>
            <EditableTagSection
              label="Genres"
              values={mp.genres || []}
              editing={editing}
              onChange={(vals) => updateDraft('genres', vals)}
            />
            <EditableTagSection
              label="Services"
              values={mp.services || []}
              editing={editing}
              onChange={(vals) => updateDraft('services', vals)}
            />
          </>
        )}
        {isVenue && (
          <>
            <EditableTagSection
              label="Gig Types"
              values={vp.gigTypes || []}
              editing={editing}
              onChange={(vals) => updateDraft('gigTypes', vals)}
            />
            <EditableTagSection
              label="Services Interested In"
              values={vp.servicesInterestedIn || []}
              editing={editing}
              onChange={(vals) => updateDraft('servicesInterestedIn', vals)}
            />
          </>
        )}

        {/* Interests */}
        <EditableTagSection
          label="Interests"
          values={current.interests || []}
          editing={editing}
          onChange={(vals) => updateDraft('interests', vals)}
          badgeVariant="warning"
        />

        {/* Venue Equipment */}
        {isVenue && (
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Equipment & Facilities</span>
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-zinc-600">Capacity</label>
                  <input type="number" className={inputClass} value={vp.capacity || ''} onChange={(e) => updateDraft('capacity', Number(e.target.value) || 0)} />
                </div>
                <EditableYesNo label="Audio Equipment" value={vp.providesAudioEquipment} onChange={(v) => updateDraft('providesAudioEquipment', v)} descValue={vp.audioEquipmentDescription} onDescChange={(v) => updateDraft('audioEquipmentDescription', v)} />
                <EditableYesNo label="Sound Engineer" value={vp.providesSoundEngineer} onChange={(v) => updateDraft('providesSoundEngineer', v)} />
                <EditableYesNo label="Lighting Equipment" value={vp.providesLightingEquipment} onChange={(v) => updateDraft('providesLightingEquipment', v)} descValue={vp.lightingEquipmentDescription} onDescChange={(v) => updateDraft('lightingEquipmentDescription', v)} />
                <EditableYesNo label="Dedicated Stage" value={vp.hasDedicatedStage} onChange={(v) => updateDraft('hasDedicatedStage', v)} descValue={vp.stageDescription} onDescChange={(v) => updateDraft('stageDescription', v)} />
              </>
            ) : (
              <>
                {vp.capacity && <InfoRow label="Capacity" value={String(vp.capacity)} />}
                <InfoRow label="Audio Equipment" value={vp.providesAudioEquipment ? `Yes${vp.audioEquipmentDescription ? ` — ${vp.audioEquipmentDescription}` : ''}` : 'No'} />
                <InfoRow label="Sound Engineer" value={vp.providesSoundEngineer ? 'Yes' : 'No'} />
                <InfoRow label="Lighting Equipment" value={vp.providesLightingEquipment ? `Yes${vp.lightingEquipmentDescription ? ` — ${vp.lightingEquipmentDescription}` : ''}` : 'No'} />
                <InfoRow label="Dedicated Stage" value={vp.hasDedicatedStage ? `Yes${vp.stageDescription ? ` — ${vp.stageDescription}` : ''}` : 'No'} />
              </>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="border-t border-zinc-800 pt-4">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Contact</span>
          {editing ? (
            <div className="space-y-2 mt-1.5">
              <div>
                <label className="text-xs text-zinc-600">Phone</label>
                <input className={inputClass} value={current.contactPhone || ''} onChange={(e) => updateDraft('contactPhone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Instagram</label>
                <input className={inputClass} value={current.socialLinks?.instagram || ''} onChange={(e) => updateDraft('socialLinks', { ...current.socialLinks, instagram: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Facebook</label>
                <input className={inputClass} value={current.socialLinks?.facebook || ''} onChange={(e) => updateDraft('socialLinks', { ...current.socialLinks, facebook: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-zinc-600">YouTube</label>
                <input className={inputClass} value={current.socialLinks?.youtube || ''} onChange={(e) => updateDraft('socialLinks', { ...current.socialLinks, youtube: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Spotify</label>
                <input className={inputClass} value={current.socialLinks?.spotify || ''} onChange={(e) => updateDraft('socialLinks', { ...current.socialLinks, spotify: e.target.value })} />
              </div>
            </div>
          ) : (
            <>
              {current.contactPhone && <InfoRow label="Phone" value={current.contactPhone} />}
              {current.socialLinks?.instagram && <InfoRow label="Instagram" value={current.socialLinks.instagram} />}
              {current.socialLinks?.facebook && <InfoRow label="Facebook" value={current.socialLinks.facebook} />}
              {current.socialLinks?.youtube && <InfoRow label="YouTube" value={current.socialLinks.youtube} />}
              {current.socialLinks?.spotify && <InfoRow label="Spotify" value={current.socialLinks.spotify} />}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EditableTagSection({
  label,
  values,
  editing,
  onChange,
  badgeVariant = 'default',
}: {
  label: string;
  values: string[];
  editing: boolean;
  onChange: (vals: string[]) => void;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const [newTag, setNewTag] = useState('');

  function addTag() {
    const t = newTag.trim();
    if (t && !values.includes(t)) {
      onChange([...values, t]);
      setNewTag('');
    }
  }

  if (!editing) {
    if (!values.length) return null;
    return (
      <div>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {values.map((v) => <Badge key={v} variant={badgeVariant}>{v}</Badge>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-zinc-500 hover:text-red-400 transition-colors">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder={`Add ${label.toLowerCase()}...`}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
      </div>
    </div>
  );
}

function EditableYesNo({
  label,
  value,
  onChange,
  descValue,
  onDescChange,
}: {
  label: string;
  value?: boolean;
  onChange: (v: boolean) => void;
  descValue?: string;
  onDescChange?: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{label}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${value === true ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}
          >Yes</button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${value === false ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}
          >No</button>
        </div>
      </div>
      {value && onDescChange && (
        <textarea
          className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
          rows={2}
          placeholder="Description..."
          value={descValue || ''}
          onChange={(e) => onDescChange(e.target.value)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:items-baseline sm:gap-2">
      <span className="text-xs uppercase tracking-wide text-zinc-500 sm:w-32 sm:flex-shrink-0 sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </span>
      <span className="text-sm text-zinc-300 break-words">{value}</span>
    </div>
  );
}

// ══════════════════════════════════════
// MEDIA PANEL
// ══════════════════════════════════════

function MediaPanel({
  profile,
  onUpdate,
  isUpdating,
}: {
  profile: AnyProfile | null | undefined;
  onUpdate: (data: Partial<AnyProfile>) => void;
  isUpdating: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    const current = profile?.images ?? [];
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const base64 = await readFileAsDataUrl(file);
        const data = await apiRequest<{ url: string }>('/api/upload/image', {
          method: 'POST',
          body: JSON.stringify({ base64 }),
        });
        urls.push(data.url);
      }
      if (urls.length) onUpdate({ images: [...current, ...urls] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(index: number) {
    const images = profile?.images ?? [];
    onUpdate({ images: images.filter((_, i) => i !== index) });
  }

  const images = profile?.images ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Media Gallery</h2>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-zinc-500 text-sm">{images.length} image{images.length !== 1 ? 's' : ''}</span>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" multiple onChange={handleAddImages} disabled={uploading} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors">
              {uploading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Images
                </>
              )}
            </span>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {uploadError && <p className="text-red-400 text-sm mb-3">{uploadError}</p>}
        {images.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No images in your gallery yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 group">
                <Image src={url} alt="" fill className="object-cover" unoptimized sizes="200px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    disabled={isUpdating}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-red-600/90 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════
// LINKS PANEL
// ══════════════════════════════════════

function LinksPanel({
  profile,
  onUpdate,
  isUpdating,
}: {
  profile: AnyProfile | null | undefined;
  onUpdate: (data: Partial<AnyProfile>) => void;
  isUpdating: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [links, setLinks] = useState({
    instagram: profile?.socialLinks?.instagram || '',
    facebook: profile?.socialLinks?.facebook || '',
    youtube: profile?.socialLinks?.youtube || '',
    spotify: profile?.socialLinks?.spotify || '',
  });

  function handleSave() {
    onUpdate({ socialLinks: links });
    setEditing(false);
  }

  const socialItems = [
    { key: 'instagram', label: 'Instagram', color: 'text-pink-400', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
    { key: 'facebook', label: 'Facebook', color: 'text-blue-400', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { key: 'youtube', label: 'YouTube', color: 'text-red-400', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { key: 'spotify', label: 'Spotify', color: 'text-green-400', icon: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Social Links</h2>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="w-full sm:w-auto">Edit</Button>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button size="sm" loading={isUpdating} onClick={handleSave} className="w-full sm:w-auto">Save</Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {socialItems.map(({ key, label, color, icon }) => (
          <div key={key} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${color}`} viewBox="0 0 24 24" fill="currentColor">
                <path d={icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-zinc-500 font-medium">{label}</span>
              {editing ? (
                <input
                  type="text"
                  value={links[key as keyof typeof links]}
                  onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Your ${label} URL`}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              ) : (
                <p className="text-sm text-zinc-300 truncate">
                  {links[key as keyof typeof links] || <span className="text-zinc-600 italic">Not set</span>}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════
// SUBSCRIPTION PANEL
// ══════════════════════════════════════

function SubscriptionPanel({ sub }: { sub: Sub | null }) {
  const hasActive = sub && (sub.status === 'active' || sub.status === 'trialing');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Subscription</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {sub ? (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasActive ? 'bg-emerald-500/15' : 'bg-zinc-800'
                }`}>
                  <CreditCardIcon className={`w-6 h-6 ${hasActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-100 font-semibold capitalize">{sub.planId.replace('_', ' ')}</span>
                    <Badge variant={hasActive ? 'success' : 'warning'}>{sub.status}</Badge>
                  </div>
                  {sub.currentPeriodEnd && (
                    <p className="text-zinc-500 text-sm">
                      {sub.status === 'trialing' ? 'Trial ends' : 'Renews'}: {new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <CreditCardIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No active subscription.</p>
              <Button size="sm" className="mt-3">View plans</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Billing History</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-zinc-500 text-sm">No billing history yet.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
