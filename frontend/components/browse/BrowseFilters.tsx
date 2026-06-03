'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type BrowseFilterFields = {
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
};

type BrowseFiltersToolbarProps = {
  showMap?: boolean;
  onToggleMap?: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  resultCount?: number;
  resultLabel?: string;
  showMapButton?: boolean;
};

export function BrowseFiltersToolbar({
  showMap,
  onToggleMap,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  resultCount,
  resultLabel = 'results',
  showMapButton = false,
}: BrowseFiltersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showMapButton && onToggleMap && (
        <Button
          variant={showMap ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleMap}
          className="gap-1.5"
          aria-pressed={showMap}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          Map
        </Button>
      )}
      <Button
        variant={filtersOpen ? 'primary' : 'secondary'}
        size="sm"
        onClick={onToggleFilters}
        className="relative gap-1.5"
        aria-expanded={filtersOpen}
        aria-controls="browse-filters-panel"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-violet-400 px-1 text-[10px] font-bold text-zinc-950">
            {activeFilterCount}
          </span>
        )}
      </Button>
      {resultCount != null && (
        <span className="text-sm text-zinc-500">
          {resultCount} {resultLabel}
        </span>
      )}
    </div>
  );
}

type BrowseFiltersPanelProps = {
  open: boolean;
  activeFilterCount: number;
  searchInput: string;
  tagsInput: string;
  filters: BrowseFilterFields;
  onSearchChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onFiltersChange: (filters: BrowseFilterFields) => void;
  onReset: () => void;
  searchPlaceholder?: string;
  tagsPlaceholder?: string;
};

export function BrowseFiltersPanel({
  open,
  activeFilterCount,
  searchInput,
  tagsInput,
  filters,
  onSearchChange,
  onTagsChange,
  onFiltersChange,
  onReset,
  searchPlaceholder = 'Title, name, description…',
  tagsPlaceholder = 'funk, jazz, cover band…',
}: BrowseFiltersPanelProps) {
  if (!open) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 sm:mb-8">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5 sm:px-4">
        <p className="text-xs font-medium text-zinc-500">
          {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active` : 'Refine results'}
        </p>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear all
          </Button>
        )}
      </div>
      <div
        id="browse-filters-panel"
        className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-4"
      >
        <Input
          label="Search"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Input
          label="Tags"
          placeholder={tagsPlaceholder}
          value={tagsInput}
          onChange={(e) => onTagsChange(e.target.value)}
        />
        <Input
          label="From date"
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
        />
        <Input
          label="To date"
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
        />
        <Input
          label="From time"
          type="time"
          value={filters.timeFrom ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, timeFrom: e.target.value || undefined })}
        />
        <Input
          label="To time"
          type="time"
          value={filters.timeTo ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, timeTo: e.target.value || undefined })}
        />
        <Button variant="secondary" size="md" onClick={onReset} className="self-end sm:col-span-2 lg:col-span-1">
          Reset all
        </Button>
      </div>
    </div>
  );
}

export function countBrowseFilters(searchInput: string, tagsInput: string, filters: BrowseFilterFields) {
  let count = 0;
  if (searchInput.trim()) count++;
  if (tagsInput.trim()) count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  if (filters.timeFrom) count++;
  if (filters.timeTo) count++;
  return count;
}

export function buildBrowseQueryParams(
  page: number,
  searchInput: string,
  tagsInput: string,
  filters: BrowseFilterFields,
  limit = '12'
): Record<string, string> {
  const params: Record<string, string> = { page: String(page), limit };
  if (searchInput.trim()) params.q = searchInput.trim();
  if (tagsInput.trim()) params.tags = tagsInput.trim();
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.timeFrom) params.timeFrom = filters.timeFrom;
  if (filters.timeTo) params.timeTo = filters.timeTo;
  return params;
}
