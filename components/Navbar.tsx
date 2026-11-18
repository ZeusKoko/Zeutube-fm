'use client';

import { APP_CONFIG } from '@/lib/config';
import type { Platform, PlatformFilter } from '@/lib/types';
import { PlatformIcon } from './PlatformBadge';

interface NavbarProps {
  activePlatform: PlatformFilter;
  onSelectPlatform: (platform: PlatformFilter) => void;
  counts: Record<PlatformFilter, number>;
}

const PLATFORM_TABS: Array<{ id: PlatformFilter; label: string }> = [
  { id: 'all', label: 'All Platforms' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'kick', label: 'Kick' },
  { id: 'tiktok', label: 'TikTok' },
];

function getActiveIconColor(platform: Platform): string {
  switch (platform) {
    case 'twitch':
      return 'text-[#9146FF]';
    case 'youtube':
      return 'text-[#FF3B3B]';
    case 'kick':
      return 'text-[#53FC18]';
    case 'tiktok':
      return 'text-[#FF2E93]';
  }
}

export default function Navbar({
  activePlatform,
  onSelectPlatform,
  counts,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#FFF5FA]/10 bg-transparent backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col lg:h-16 lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-6 px-4 py-2.5 lg:py-0 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7] bg-clip-text text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E93] rounded self-start lg:self-auto"
        >
          {APP_CONFIG.APP_NAME}
        </a>

        <nav
          aria-label="Platform filters"
          role="tablist"
          className="flex w-full lg:w-auto items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
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
                className={`min-h-[42px] inline-flex items-center gap-2 rounded-full border px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-[background-color,border-color,box-shadow,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7] ${
                  isActive
                    ? 'border-[#FF2E93] bg-[#2D0F33]/85 text-[#FFF5FA] shadow-[0_0_20px_-3px_rgba(255,46,147,0.5)]'
                    : 'border-[#B7A9CC]/20 bg-[#170B2A]/55 text-[#D4C7E5] hover:border-[#B7A9CC]/40 hover:bg-[#21113B]/75 hover:text-[#FFF5FA]'
                }`}
              >
                {tab.id !== 'all' && (
                  <PlatformIcon
                    platform={tab.id}
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? getActiveIconColor(tab.id) : 'text-[#B7A9CC]'
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums transition-colors ${
                    isActive
                      ? 'bg-[#FF2E93] text-[#FFF5FA]'
                      : 'bg-[#0B0614]/85 text-[#B7A9CC]'
                  }`}
                >
                  {typeof count === 'number' ? count : 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
