'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type FilterPanelProps = {
  filters: { genre?: string; location?: string; dateFrom?: string; dateTo?: string };
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  className?: string;
};

export function FilterPanel({ filters, onFilterChange, onReset, className }: FilterPanelProps) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800', className)}>
      <Input
        label="Genre"
        placeholder="e.g. Rock"
        value={filters.genre ?? ''}
        onChange={(e) => onFilterChange('genre', e.target.value)}
        className="min-w-[120px]"
      />
      <Input
        label="Location"
        placeholder="City or region"
        value={filters.location ?? ''}
        onChange={(e) => onFilterChange('location', e.target.value)}
        className="min-w-[140px]"
      />
      <Input
        label="From date"
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(e) => onFilterChange('dateFrom', e.target.value)}
        className="min-w-[140px]"
      />
      <Input
        label="To date"
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(e) => onFilterChange('dateTo', e.target.value)}
        className="min-w-[140px]"
      />
      <Button variant="secondary" size="md" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
