'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  type RevenueItem,
  type DatePreset,
  formatRevenue,
  formatRevenueDate,
  filterRevenueItems,
  buildMonthlySeries,
  buildPartnerBreakdown,
  computeRevenueStats,
  getPresetRange,
} from '@/lib/revenueAnalytics';

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'custom', label: 'Custom' },
];

function getItemTimestamp(item: RevenueItem) {
  return new Date(item.date || item.completedAt).getTime();
}

type ChartPoint = { item: RevenueItem; xPct: number; yPct: number };

type ChartLayout = {
  minT: number;
  maxT: number;
  maxY: number;
  eventPoints: ChartPoint[];
  monthPoints: { x: number; y: number; label: string; monthKey: string; value: number }[];
};

function buildChartLayout(
  events: RevenueItem[],
  series: { label: string; value: number; monthKey: string }[],
  width: number,
  height: number,
  pad: { top: number; right: number; bottom: number; left: number }
): ChartLayout | null {
  if (!events.length && !series.length) return null;

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const eventTimes = events.map(getItemTimestamp);
  const monthTimes = series.map((s) => {
    const [y, m] = s.monthKey.split('-');
    return new Date(Number(y), Number(m) - 1, 15).getTime();
  });

  const allTimes = [...eventTimes, ...monthTimes];
  const minT = Math.min(...allTimes);
  const maxT = Math.max(...allTimes);
  const span = maxT - minT || 1;
  const maxY = Math.max(...events.map((e) => e.amount), ...series.map((s) => s.value), 1);

  const xFromTime = (t: number) => pad.left + ((t - minT) / span) * innerW;
  const yFromValue = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  const monthPoints = series.map((s) => {
    const [y, m] = s.monthKey.split('-');
    const t = new Date(Number(y), Number(m) - 1, 15).getTime();
    return {
      x: xFromTime(t),
      y: yFromValue(s.value),
      label: s.label,
      monthKey: s.monthKey,
      value: s.value,
    };
  });

  const dayGroups = new Map<string, RevenueItem[]>();
  for (const item of events) {
    const key = new Date(item.date || item.completedAt).toISOString().slice(0, 10);
    const group = dayGroups.get(key) || [];
    group.push(item);
    dayGroups.set(key, group);
  }

  const eventPoints: ChartPoint[] = [];
  Array.from(dayGroups.values()).forEach((group) => {
    group.forEach((item, index) => {
      const t = getItemTimestamp(item);
      const spreadMs = group.length > 1 ? (index - (group.length - 1) / 2) * 86400000 * 0.4 : 0;
      const x = xFromTime(t + spreadMs);
      const y = yFromValue(item.amount);
      const xPct = (x / width) * 100;
      const yPct = (y / height) * 100;
      eventPoints.push({ item, xPct, yPct });
    });
  });

  eventPoints.sort((a, b) => getItemTimestamp(a.item) - getItemTimestamp(b.item));

  return { minT, maxT, maxY, eventPoints, monthPoints };
}

function ChartTooltip({
  item,
  x,
  y,
  pinned,
  tooltipRef,
}: {
  item: RevenueItem;
  x: number;
  y: number;
  pinned?: boolean;
  tooltipRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={tooltipRef}
      className={`absolute z-20 min-w-[200px] max-w-[260px] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-sky-500/30 bg-zinc-950/95 px-3.5 py-3 shadow-xl shadow-black/40 backdrop-blur-md ${
        pinned ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <p className="text-sm font-semibold leading-snug text-zinc-50">{item.title}</p>
      <p className="mt-2 text-lg font-bold text-sky-300">{formatRevenue(item.amount)}</p>
      <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2 text-xs text-zinc-400">
        <p>
          <span className="text-zinc-500">Venue · </span>
          {item.partnerName}
        </p>
        <p>
          <span className="text-zinc-500">Date · </span>
          {formatRevenueDate(item.date || item.completedAt)}
        </p>
        <p>
          <span className="text-zinc-500">Status · </span>
          Finalized gig
        </p>
      </div>
      {pinned && (
        <p className="mt-2 text-[10px] text-zinc-600">Tap the dot again or anywhere outside this popup to close</p>
      )}
    </div>
  );
}

function RevenueAreaChart({ series, events }: { series: { label: string; value: number; monthKey: string }[]; events: RevenueItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState<RevenueItem | null>(null);
  const [hovered, setHovered] = useState<RevenueItem | null>(null);
  const [blockHover, setBlockHover] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const visibleItem = pinned ?? hovered;

  useEffect(() => {
    setPinned(null);
    setHovered(null);
    setBlockHover(false);
  }, [events]);

  useEffect(() => {
    if (!pinned) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (tooltipRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-revenue-dot]')) return;
      setPinned(null);
      setHovered(null);
      setBlockHover(true);
    }
    // Capture phase: Modal dialog stops bubble-phase clicks, so document bubble listeners never run on desktop.
    document.addEventListener('click', handleOutside, true);
    document.addEventListener('touchend', handleOutside, true);
    return () => {
      document.removeEventListener('click', handleOutside, true);
      document.removeEventListener('touchend', handleOutside, true);
    };
  }, [pinned]);

  const width = 800;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 36, left: 8 };
  const innerH = height - pad.top - pad.bottom;

  const layout = useMemo(
    () => buildChartLayout(events, series, width, height, pad),
    [events, series]
  );

  if (!layout) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/50">
        <p className="text-sm text-zinc-500">No revenue in this period</p>
      </div>
    );
  }

  const { eventPoints, monthPoints } = layout;
  const linePath =
    monthPoints.length > 0
      ? monthPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      : '';
  const areaPath =
    monthPoints.length > 0
      ? `${linePath} L ${monthPoints[monthPoints.length - 1].x} ${pad.top + innerH} L ${monthPoints[0].x} ${pad.top + innerH} Z`
      : '';
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => pad.top + innerH - t * innerH);

  function positionAtPercent(xPct: number, yPct: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: (xPct / 100) * rect.width, y: (yPct / 100) * rect.height });
  }

  function showHoverTooltip(item: RevenueItem, clientX: number, clientY: number) {
    if (pinned || blockHover) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered(item);
    setTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
  }

  function togglePinned(item: RevenueItem, xPct: number, yPct: number) {
    if (pinned?.id === item.id) {
      setPinned(null);
      return;
    }
    setPinned(item);
    setHovered(null);
    positionAtPercent(xPct, yPct);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/15 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-sky-950/30 p-4">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" aria-hidden />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Revenue trend</p>
        {events.length > 0 && (
          <p className="text-[10px] text-zinc-600">
            Tap or hover dots for gig details · {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div
        ref={containerRef}
        className="relative h-[220px]"
        onMouseLeave={() => setBlockHover(false)}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" role="img" aria-label="Revenue trend chart">
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(56, 189, 248)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="revenueLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(125, 211, 252)" />
              <stop offset="100%" stopColor="rgb(14, 165, 233)" />
            </linearGradient>
          </defs>
          {gridLines.map((y, i) => (
            <line key={i} x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="rgb(63,63,70)" strokeOpacity="0.35" strokeDasharray="4 6" />
          ))}
          {areaPath && <path d={areaPath} fill="url(#revenueAreaGrad)" />}
          {linePath && (
            <path d={linePath} fill="none" stroke="url(#revenueLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {monthPoints.map((p) => (
            <text key={p.monthKey} x={p.x} y={height - 8} textAnchor="middle" fill="rgb(161,161,170)" fontSize="11">
              {p.label}
            </text>
          ))}
        </svg>

        {eventPoints.map(({ item, xPct, yPct }) => {
          const active = visibleItem?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-revenue-dot
              className="group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 touch-manipulation"
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
              aria-label={`${item.title}, ${formatRevenue(item.amount)}`}
              aria-expanded={pinned?.id === item.id}
              onClick={(e) => {
                e.stopPropagation();
                togglePinned(item, xPct, yPct);
              }}
              onMouseEnter={(e) => showHoverTooltip(item, e.clientX, e.clientY)}
              onMouseMove={(e) => showHoverTooltip(item, e.clientX, e.clientY)}
              onMouseLeave={() => setHovered(null)}
              onFocus={(e) => {
                if (pinned) return;
                const rect = e.currentTarget.getBoundingClientRect();
                showHoverTooltip(item, rect.left + rect.width / 2, rect.top);
              }}
              onBlur={() => {
                if (!pinned) setHovered(null);
              }}
            >
              <span
                className={`rounded-full border-2 transition-all duration-150 ${
                  active
                    ? 'h-4 w-4 border-cyan-100 bg-sky-400 shadow-lg shadow-sky-500/40'
                    : 'h-3 w-3 border-sky-100/90 bg-sky-500 group-hover:h-4 group-hover:w-4 group-hover:border-white group-hover:bg-sky-400 group-hover:shadow-lg group-hover:shadow-sky-500/30'
                }`}
              />
            </button>
          );
        })}

        {visibleItem && (
          <ChartTooltip
            item={visibleItem}
            x={tooltipPos.x}
            y={tooltipPos.y}
            pinned={!!pinned}
            tooltipRef={tooltipRef}
          />
        )}
      </div>
    </div>
  );
}

function PartnerBars({ rows }: { rows: { name: string; value: number; gigs: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (!rows.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Top venues</p>
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={row.name}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-zinc-200">
                <span className="mr-2 text-zinc-600">{i + 1}.</span>
                {row.name}
              </span>
              <span className="shrink-0 font-semibold text-sky-300">{formatRevenue(row.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-600">{row.gigs} gig{row.gigs !== 1 ? 's' : ''}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function RevenueFilters({
  preset,
  from,
  to,
  onPreset,
  onFrom,
  onTo,
}: {
  preset: DatePreset;
  from: string;
  to: string;
  onPreset: (p: DatePreset) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.filter((p) => p.key !== 'custom').map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPreset(p.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === p.key
                ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/40'
                : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t border-zinc-800/80 pt-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              onPreset('custom');
              onFrom(e.target.value);
            }}
            className="w-[150px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              onPreset('custom');
              onTo(e.target.value);
            }}
            className="w-[150px]"
          />
        </div>
        {preset === 'custom' && (
          <span className="pb-2 text-xs text-zinc-500">Custom range</span>
        )}
      </div>
    </div>
  );
}

function RevenueContent({ items }: { items: RevenueItem[] }) {
  const [preset, setPreset] = useState<DatePreset>('all');
  const [from, setFrom] = useState(() => getPresetRange('all').from);
  const [to, setTo] = useState(() => getPresetRange('all').to);

  function applyPreset(next: DatePreset) {
    setPreset(next);
    if (next !== 'custom') {
      const range = getPresetRange(next);
      setFrom(range.from);
      setTo(range.to);
    }
  }

  const filtered = useMemo(() => filterRevenueItems(items, from, to), [items, from, to]);
  const stats = useMemo(() => computeRevenueStats(filtered), [filtered]);
  const series = useMemo(() => buildMonthlySeries(filtered), [filtered]);
  const partners = useMemo(() => buildPartnerBreakdown(filtered), [filtered]);

  return (
    <div className="space-y-5">
      <RevenueFilters preset={preset} from={from} to={to} onPreset={applyPreset} onFrom={setFrom} onTo={setTo} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Total revenue" value={formatRevenue(stats.total)} sub={`${stats.count} finalized gig${stats.count !== 1 ? 's' : ''}`} />
        <KpiTile label="Average per gig" value={formatRevenue(stats.average)} />
        <KpiTile label="Peak month" value={stats.peakValue ? formatRevenue(stats.peakValue) : '—'} sub={stats.peakMonth !== '—' ? stats.peakMonth : undefined} />
        <KpiTile
          label="In range"
          value={filtered.length.toString()}
          sub={from && to ? `${formatRevenueDate(from)} – ${formatRevenueDate(to)}` : undefined}
        />
      </div>

      <RevenueAreaChart series={series} events={filtered} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PartnerBars rows={partners} />
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent transactions</p>
          {!filtered.length ? (
            <p className="text-sm text-zinc-500">No transactions in this period.</p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {[...filtered]
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-zinc-900/40 px-3 py-2.5 transition-colors hover:border-sky-500/20 hover:bg-sky-500/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-500">
                        {item.partnerName} · {formatRevenueDate(item.date || item.completedAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-sky-300">{formatRevenue(item.amount)}</p>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function RevenueAnalyticsModal({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: RevenueItem[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Revenue analytics" className="max-w-5xl" position="center">
      <p className="-mt-2 mb-5 text-sm text-zinc-500">
        Track earnings from finalized gigs. Filter by date range and explore trends.
      </p>
      {!items.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
          <p className="text-sm text-zinc-500">No revenue recorded yet. Complete gigs to see analytics here.</p>
        </div>
      ) : (
        <RevenueContent items={items} />
      )}
    </Modal>
  );
}
