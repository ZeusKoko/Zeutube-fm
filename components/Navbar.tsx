'use client';

import { APP_CONFIG } from '@/lib/config';
import type { PlatformFilter } from '@/lib/types';

interface NavbarProps {
  activePlatform: PlatformFilter;
  onSelectPlatform: (platform: PlatformFilter) => void;
  counts: Record<PlatformFilter, number>;
}

const PLATFORM_TABS: Array<{ id: PlatformFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'kick', label: 'Kick' },
  { id: 'tiktok', label: 'TikTok' },
];

export default function Navbar({
  activePlatform,
  onSelectPlatform,
  counts,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#B7A9CC]/15 bg-[#0B0614]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col sm:h-14 sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-4 py-2 sm:py-0 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7] bg-clip-text text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E93] rounded self-start sm:self-auto"
        >
          {APP_CONFIG.APP_NAME}
        </a>

        <nav
          aria-label="Platform filters"
          role="tablist"
          className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar"
        >
          {PLATFORM_TABS.map((tab) => {
            const isActive = activePlatform === tab.id;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectPlatform(tab.id)}
                className={`min-h-[40px] sm:min-h-[38px] px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7] ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7] text-[#FFF5FA] shadow-[0_0_16px_-3px_rgba(255,46,147,0.5)]'
                    : 'text-[#B7A9CC] hover:text-[#FFF5FA] hover:bg-[#170B2A]'
                }`}
              >
                <span>{tab.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`hidden sm:inline ml-1.5 tabular-nums text-[11px] ${
                      isActive ? 'text-[#FFF5FA]/90' : 'text-[#B7A9CC]/70'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
