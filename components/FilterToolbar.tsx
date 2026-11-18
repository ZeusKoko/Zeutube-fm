'use client';

import { Clock, Search, Users, X } from 'lucide-react';
import type { SortOption } from '@/lib/types';

interface FilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  visibleCount: number;
  isTikTokTab: boolean;
}

export default function FilterToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  visibleCount,
  isTikTokTab,
}: FilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search input */}
      <div className="relative flex-1 sm:max-w-sm">
        <label htmlFor="streamer-search" className="sr-only">
          Search streamers by name
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B7A9CC]"
          aria-hidden="true"
        />
        <input
          id="streamer-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search streamer name…"
          className="min-h-[44px] w-full rounded-xl border border-[#B7A9CC]/20 bg-[#170B2A] pl-10 pr-10 text-sm text-[#FFF5FA] placeholder:text-[#B7A9CC]/70 focus:border-[#FF2E93] focus:outline-none focus:ring-2 focus:ring-[#FF2E93]/40"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#B7A9CC] hover:text-[#FFF5FA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Sort & count controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs font-medium text-[#B7A9CC] tabular-nums whitespace-nowrap">
          {isTikTokTab
            ? `${visibleCount} TikTok ${visibleCount === 1 ? 'creator' : 'creators'}`
            : `Showing ${visibleCount} live`}
        </span>

        {!isTikTokTab && (
          <div
            role="group"
            aria-label="Sort streams"
            className="inline-flex items-center rounded-xl border border-[#B7A9CC]/15 bg-[#170B2A] p-1"
          >
            <button
              type="button"
              onClick={() => onSortChange('viewers')}
              aria-pressed={sort === 'viewers'}
              className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7] ${
                sort === 'viewers'
                  ? 'bg-[#2B154D] text-[#FFF5FA]'
                  : 'text-[#B7A9CC] hover:text-[#FFF5FA]'
              }`}
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Most viewers</span>
            </button>

            <button
              type="button"
              onClick={() => onSortChange('newest')}
              aria-pressed={sort === 'newest'}
              className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7] ${
                sort === 'newest'
                  ? 'bg-[#2B154D] text-[#FFF5FA]'
                  : 'text-[#B7A9CC] hover:text-[#FFF5FA]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Newest live</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
