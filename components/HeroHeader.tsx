'use client';

import Image from 'next/image';
import { APP_CONFIG } from '@/lib/config';
import { formatRelativeUpdated } from '@/lib/stream-utils';

interface HeroHeaderProps {
  totalLiveCount: number;
  updatedAt: string | null;
  nowMs: number;
  isDemoData: boolean;
  isLoading: boolean;
  onJumpKenyan: () => void;
}

export default function HeroHeader({
  totalLiveCount,
  updatedAt,
  nowMs,
  isDemoData,
  isLoading,
  onJumpKenyan,
}: HeroHeaderProps) {
  const updatedLabel = updatedAt ? formatRelativeUpdated(updatedAt, nowMs) : 'Loading streams…';

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-[#B7A9CC]/15 bg-[#0B0614]"
    >
      {/* Atmospheric Vice sunset backdrop */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image
          src="/images/hero_leonida_sunset.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          referrerPolicy="no-referrer"
          className="object-cover object-center opacity-30"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,6,20,0.65) 0%, rgba(11,6,20,0.82) 55%, #0B0614 100%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#FFF5FA] sm:text-4xl lg:text-5xl text-balance">
              Who is live on{' '}
              <span className="bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#FFD23F] bg-clip-text text-transparent">
                {APP_CONFIG.TARGET_GAME_TITLE}
              </span>{' '}
              right now
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#B7A9CC] sm:text-base max-w-xl">
              Jump straight into live broadcasts across YouTube, Twitch, Kick, and curated TikTok
              creators. No account needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
            {/* Live stream count */}
            <div
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#FF3B3B]/35 bg-[#170B2A]/90 px-3.5 py-2"
              aria-live="polite"
            >
              <span
                className="h-2.5 w-2.5 rounded-full bg-[#FF3B3B] live-dot-pulse shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm font-semibold text-[#FFF5FA] tabular-nums whitespace-nowrap">
                {isLoading ? 'Checking live streams…' : `${totalLiveCount} streamers live now`}
              </span>
            </div>

            {/* Quick jump to Kenyan streamers */}
            <button
              type="button"
              onClick={onJumpKenyan}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#00E5C7]/35 bg-[#170B2A]/90 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#00E5C7] hover:bg-[#00E5C7]/15 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7]"
            >
              <span aria-hidden="true">🇰🇪</span>
              <span className="whitespace-nowrap">Kenyan Streamers</span>
            </button>
          </div>
        </div>

        {/* Quiet status metadata row (no boxed pills) */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#B7A9CC]">
          <span>{updatedLabel}</span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span aria-hidden="true">·</span>
            <span>Auto-refreshes every 60s</span>
          </span>
          {isDemoData && (
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span aria-hidden="true">·</span>
              <span
                data-testid="demo-data-badge"
                className="font-semibold text-[#FFD23F]"
                title="Showing demo data because live platform API keys are not configured"
              >
                Demo data
              </span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
