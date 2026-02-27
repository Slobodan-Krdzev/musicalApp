'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type Sub = { planId: string; status: string; currentPeriodEnd?: string; trialEnd?: string };
type Notif = { _id: string; message: string; isRead: boolean; createdAt: string };
type EventsRes = { events: Array<{ _id: string; title: string; status: string; date?: string }> };
type ApplicationsRes = { applications: Array<{ _id: string; status: string; eventId?: { title: string } }> };
type AdvertsRes = { adverts: Array<{ _id: string; title: string; status: string }> };

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiRequest<{ subscription: Sub | null }>('/api/users/me/subscription').then((r) => r.subscription),
    enabled: !!user,
  });
  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      apiRequest<{ notifications: Notif[]; unreadCount: number }>('/api/notifications?limit=5').then((r) => r),
    enabled: !!user,
  });
  const isVenue = user?.role === 'VENUE';
  const isMusician = user?.role === 'MUSICIAN';

  const { data: myEvents } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => apiRequest<EventsRes>('/api/events/my').then((r) => r.events),
    enabled: !!user && isVenue,
  });
  const { data: applications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => apiRequest<ApplicationsRes>('/api/applications/my').then((r) => r.applications),
    enabled: !!user && isMusician,
  });
  const { data: adverts } = useQuery({
    queryKey: ['my-adverts'],
    queryFn: () => apiRequest<AdvertsRes>('/api/adverts/my').then((r) => r.adverts),
    enabled: !!user && isMusician,
  });

  const hasActiveSub = sub && (sub.status === 'active' || sub.status === 'trialing');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400">Welcome back, {user?.email}</p>
      </div>

      {/* Subscription status */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-100">Subscription</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {sub ? (
              <>
                <Badge variant={hasActiveSub ? 'success' : 'warning'}>{sub.planId}</Badge>
                <span className="ml-2 text-zinc-400 text-sm">
                  {sub.status} {sub.currentPeriodEnd && `· Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                </span>
              </>
            ) : (
              <span className="text-zinc-400">No active subscription</span>
            )}
          </div>
          {(!sub || !hasActiveSub) && (
            <Link href="/dashboard#plans">
              <Button size="sm">View plans</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-zinc-100">Notifications</h2>
          {notifs && notifs.unreadCount > 0 && (
            <Badge variant="warning">{notifs.unreadCount} unread</Badge>
          )}
        </CardHeader>
        <CardContent>
          {notifs?.notifications?.length ? (
            <ul className="space-y-2">
              {notifs.notifications.slice(0, 5).map((n) => (
                <li key={n._id} className={`text-sm ${n.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>
                  {n.message}
                  <span className="ml-2 text-zinc-600 text-xs">{new Date(n.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500 text-sm">No notifications yet.</p>
          )}
        </CardContent>
      </Card>

      {isVenue && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-zinc-100">My Events</h2>
              <Link href="/events/create">
                <Button size="sm" disabled={!hasActiveSub}>Create event</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myEvents?.length ? (
                <ul className="space-y-2">
                  {myEvents.slice(0, 5).map((e) => (
                    <li key={e._id}>
                      <Link href={`/events/${e._id}`} className="text-violet-400 hover:underline">
                        {e.title}
                      </Link>
                      <Badge className="ml-2">{e.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm">No events yet. Create one to get started.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isMusician && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-zinc-100">My Adverts</h2>
              <Link href="/adverts/create">
                <Button size="sm" disabled={!hasActiveSub}>Create advert</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {adverts?.length ? (
                <ul className="space-y-2">
                  {adverts.slice(0, 5).map((a) => (
                    <li key={a._id}>
                      {a.title} <Badge>{a.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm">No adverts yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-100">Applied Events</h2>
            </CardHeader>
            <CardContent>
              {applications?.length ? (
                <ul className="space-y-2">
                  {applications.slice(0, 5).map((a) => (
                    <li key={a._id}>
                      {typeof a.eventId === 'object' && a.eventId?.title}{' '}
                      <Badge variant={a.status === 'ACCEPTED' ? 'success' : a.status === 'REJECTED' ? 'danger' : 'default'}>
                        {a.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm">No applications yet. Browse events and apply.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isVenue && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-zinc-100">Browse Musicians</h2>
          </CardHeader>
          <CardContent>
            <Link href="/musicians">
              <Button variant="secondary" size="sm">Browse musicians</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
