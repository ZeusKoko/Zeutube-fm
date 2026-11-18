'use client';

import { ExternalLink } from 'lucide-react';
import type { DirectoryStreamer } from '@/lib/types';
import { KenyanFlagBadge, PlatformIcon } from './PlatformBadge';
import StreamerAvatar from './StreamerAvatar';

export default function TikTokCard({ creator }: { creator: DirectoryStreamer }) {
  const tiktokStream = creator.platforms[0];
  if (!tiktokStream) return null;

  return (
    <article className="flex flex-col justify-between gap-4 rounded-2xl border border-[#B7A9CC]/15 bg-[#170B2A] p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#FF2E93]/45 hover:shadow-[0_0_20px_-6px_rgba(255,46,147,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center gap-3 min-w-0">
        <StreamerAvatar name={creator.displayName} avatarUrl={creator.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-base font-bold text-[#FFF5FA]">
              {creator.displayName}
            </h3>
            {creator.country === 'KE' && <KenyanFlagBadge />}
          </div>
          <p className="truncate text-xs text-[#B7A9CC]">{tiktokStream.title}</p>
        </div>
      </div>

      <a
        href={tiktokStream.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Check ${creator.displayName} on TikTok`}
        className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#FF2E93]/40 bg-[#251242] px-4 py-2 text-xs sm:text-sm font-semibold text-[#FFF5FA] hover:bg-[#FF2E93]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7]"
      >
        <PlatformIcon platform="tiktok" className="h-4 w-4 text-[#FF2E93]" />
        <span>Check on TikTok</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
      </a>
    </article>
  );
}
