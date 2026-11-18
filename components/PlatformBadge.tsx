import { Play, Radio, Smartphone, Tv } from 'lucide-react';
import type { Platform } from '@/lib/types';

export function PlatformIcon({
  platform,
  className = 'w-3.5 h-3.5',
}: {
  platform: Platform;
  className?: string;
}) {
  switch (platform) {
    case 'youtube':
      return <Play className={className} aria-hidden="true" />;
    case 'twitch':
      return <Tv className={className} aria-hidden="true" />;
    case 'kick':
      return <Radio className={className} aria-hidden="true" />;
    case 'tiktok':
      return <Smartphone className={className} aria-hidden="true" />;
  }
}

export function getPlatformBadgeClasses(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return 'bg-[#FF3B3B]/15 text-[#FF8A8A] border-[#FF3B3B]/35';
    case 'twitch':
      return 'bg-[#7B2FF7]/20 text-[#D4B8FF] border-[#7B2FF7]/40';
    case 'kick':
      return 'bg-[#00E5C7]/15 text-[#66F5E3] border-[#00E5C7]/35';
    case 'tiktok':
      return 'bg-[#FF2E93]/15 text-[#FF8AC2] border-[#FF2E93]/35';
  }
}

export function getPlatformButtonClasses(platform: Platform, isPrimary: boolean): string {
  if (isPrimary) {
    return 'bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7] text-[#FFF5FA] shadow-sm hover:brightness-110';
  }
  switch (platform) {
    case 'youtube':
      return 'bg-[#251242] text-[#FFF5FA] border border-[#FF3B3B]/40 hover:bg-[#FF3B3B]/20';
    case 'twitch':
      return 'bg-[#251242] text-[#FFF5FA] border border-[#7B2FF7]/45 hover:bg-[#7B2FF7]/25';
    case 'kick':
      return 'bg-[#251242] text-[#FFF5FA] border border-[#00E5C7]/40 hover:bg-[#00E5C7]/20';
    case 'tiktok':
      return 'bg-[#251242] text-[#FFF5FA] border border-[#FF2E93]/40 hover:bg-[#FF2E93]/20';
  }
}

export function KenyanFlagBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-[#00E5C7]/12 border border-[#00E5C7]/30 px-1.5 py-0.5 text-[11px] font-medium text-[#00E5C7] whitespace-nowrap shrink-0"
      title="Kenyan Streamer"
      aria-label="Kenyan streamer"
    >
      <span role="img" aria-hidden="true">
        🇰🇪
      </span>
      {!compact && <span>KE</span>}
    </span>
  );
}
