'use client';

import { ExternalLink } from 'lucide-react';
import { getPlatformLabel } from '@/lib/stream-utils';
import type { DirectoryStreamer } from '@/lib/types';
import { KenyanFlagBadge, PlatformIcon } from './PlatformBadge';
import StreamerAvatar from './StreamerAvatar';

export default function OfflineRow({ streamers }: { streamers: DirectoryStreamer[] }) {
  if (streamers.length === 0) return null;

  return (
    <section aria-labelledby="offline-heading" className="border-t border-[#B7A9CC]/15 pt-8">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2
            id="offline-heading"
            className="font-display text-lg font-bold text-[#B7A9CC] sm:text-xl"
          >
            Not live right now
          </h2>
          <p className="mt-0.5 text-xs text-[#B7A9CC]/75">
            Curated creators currently offline — check their channels directly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {streamers.map((person) => {
          const primaryChannel = person.platforms[0];
          return (
            <div
              key={person.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#B7A9CC]/10 bg-[#170B2A]/60 px-3.5 py-3 opacity-85 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StreamerAvatar
                  name={person.displayName}
                  avatarUrl={person.avatarUrl}
                  size="sm"
                  muted
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[#FFF5FA]/90">
                      {person.displayName}
                    </span>
                    {person.country === 'KE' && <KenyanFlagBadge compact />}
                  </div>
                  <span className="text-xs text-[#B7A9CC]/70">Offline</span>
                </div>
              </div>

              {primaryChannel ? (
                <a
                  href={primaryChannel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${person.displayName} on ${getPlatformLabel(
                    primaryChannel.platform
                  )}`}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-[#B7A9CC]/20 bg-[#0B0614]/60 px-3 py-1.5 text-xs font-medium text-[#B7A9CC] hover:border-[#B7A9CC]/45 hover:text-[#FFF5FA] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7]"
                >
                  <PlatformIcon platform={primaryChannel.platform} className="h-3.5 w-3.5" />
                  <span>{getPlatformLabel(primaryChannel.platform)}</span>
                  <ExternalLink className="h-3 w-3 opacity-75" aria-hidden="true" />
                </a>
              ) : (
                <span className="text-xs text-[#B7A9CC]/50 whitespace-nowrap">Channel pending</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
