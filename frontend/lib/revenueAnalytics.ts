export type RevenueItem = {
  id: string;
  title: string;
  date: string | null;
  completedAt: string;
  amount: number;
  partnerName: string;
  partnerUserId: string;
};

export type DatePreset = 'all' | '30d' | '90d' | 'ytd' | 'custom';

export function formatRevenue(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRevenueDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function itemDate(item: RevenueItem) {
  return new Date(item.date || item.completedAt);
}

export function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  to.setHours(23, 59, 59, 999);

  if (preset === '30d') {
    from.setDate(from.getDate() - 30);
  } else if (preset === '90d') {
    from.setDate(from.getDate() - 90);
  } else if (preset === 'ytd') {
    from.setMonth(0, 1);
  } else {
    from.setFullYear(2000, 0, 1);
  }
  from.setHours(0, 0, 0, 0);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function filterRevenueItems(items: RevenueItem[], from: string, to: string) {
  if (!from && !to) return items;
  const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : 0;
  const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
  return items.filter((item) => {
    const ts = itemDate(item).getTime();
    return ts >= fromTs && ts <= toTs;
  });
}

export type MonthlyPoint = { label: string; value: number; monthKey: string };

export function buildMonthlySeries(items: RevenueItem[]): MonthlyPoint[] {
  const buckets = new Map<string, number>();
  for (const item of items) {
    const d = itemDate(item);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) || 0) + item.amount);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, {
        month: 'short',
        year: '2-digit',
      });
      return { label, value, monthKey: key };
    });
}

export type PartnerRow = { name: string; value: number; gigs: number };

export function buildPartnerBreakdown(items: RevenueItem[], limit = 5): PartnerRow[] {
  const map = new Map<string, { value: number; gigs: number }>();
  for (const item of items) {
    const cur = map.get(item.partnerName) || { value: 0, gigs: 0 };
    map.set(item.partnerName, { value: cur.value + item.amount, gigs: cur.gigs + 1 });
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function computeRevenueStats(items: RevenueItem[]) {
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const count = items.length;
  const average = count ? total / count : 0;
  const monthly = buildMonthlySeries(items);
  const peak = monthly.reduce((best, p) => (p.value > best.value ? p : best), { label: '—', value: 0, monthKey: '' });
  return { total, count, average, peakMonth: peak.label, peakValue: peak.value };
}
