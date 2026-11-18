'use client';

import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { formatViewerCount, getPlatformLabel } from '@/lib/stream-utils';
import type { DirectoryStreamer } from '@/lib/types';
import {
  getPlatformButtonClasses,
  KenyanFlagBadge,
  PlatformIcon,
} from './PlatformBadge';
import StreamerAvatar from './StreamerAvatar';

interface StreamerCardProps {
  streamer: DirectoryStreamer;
  priorityBadge?: string;
}

export default function StreamerCard({ streamer, priorityBadge }: StreamerCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumbnail = Boolean(streamer.thumbnailUrl && !thumbFailed);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#B7A9CC]/15 bg-[#170B2A] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#FF2E93]/45 hover:shadow-[0_0_24px_-4px_rgba(255,46,147,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* 16:9 Stream Preview Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#231140]">
        {showThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streamer.thumbnailUrl}
            alt={`${streamer.displayName} stream preview`}
            width={480}
            height={270}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setThumbFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2B124C] via-[#170B2A] to-[#361139]"
            aria-hidden="true"
          >
            <span className="font-display text-lg font-bold tracking-tight text-[#FFF5FA]/40">
              {streamer.displayName}
            </span>
          </div>
        )}

        {/* Contrast scrim */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0614]/90 via-[#0B0614]/20 to-transparent"
          aria-hidden="true"
        />

        {/* Top bar inside thumbnail: LIVE badge + viewer count */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#FF3B3B] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#FFF5FA] shadow-sm">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#FFF5FA] live-dot-pulse"
              aria-hidden="true"
            />
            <span>LIVE</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-md bg-[#0B0614]/80 px-2 py-0.5 text-xs font-semibold text-[#FFF5FA] backdrop-blur-sm tabular-nums">
            <Eye className="h-3.5 w-3.5 text-[#FF8A3D]" aria-hidden="true" />
            <span>{formatViewerCount(streamer.totalViewers)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <StreamerAvatar name={streamer.displayName} avatarUrl={streamer.avatarUrl} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-display text-base font-bold text-[#FFF5FA]">
                {streamer.displayName}
              </h3>
              {streamer.country === 'KE' && <KenyanFlagBadge />}
            </div>
            <p className="truncate text-xs text-[#B7A9CC] tabular-nums">
              {formatViewerCount(streamer.totalViewers)} watching
              {' · '}
              {streamer.platforms.map((p) => getPlatformLabel(p.platform)).join(' + ')}
              {priorityBadge ? ` · ${priorityBadge}` : ''}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-snug text-[#B7A9CC] min-h-[2.5rem]">
          {streamer.primaryTitle}
        </p>

        {/* Action buttons: 1 button per active live platform */}
        <div
          className={`mt-auto pt-1 flex flex-wrap gap-2 ${
            streamer.platforms.length === 1 ? '' : 'grid grid-cols-2'
          }`}
        >
          {streamer.platforms.map((platformStream, index) => {
            const label = getPlatformLabel(platformStream.platform);
            const isPrimary = index === 0;
            return (
              <a
                key={platformStream.platform}
                href={platformStream.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch ${streamer.displayName} on ${label}`}
                className={`min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-[filter,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7] ${getPlatformButtonClasses(
                  platformStream.platform,
                  isPrimary
                )}`}
              >
                <PlatformIcon platform={platformStream.platform} className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {streamer.platforms.length === 1 ? `Watch on ${label}` : label}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden="true" />
              </a>
            );
          })}
        </div>
      </div>
    </article>
  );
}
