import type {
  CuratedStreamer,
  DirectoryStreamer,
  Platform,
  PlatformFilter,
  PlatformStream,
  SortOption,
} from './types';

export interface DiscoveredStreamInput {
  platform: Exclude<Platform, 'tiktok'>;
  channelHandle: string;
  displayName: string;
  avatarUrl?: string;
  title: string;
  viewerCount: number;
  startedAt: string | null;
  thumbnailUrl?: string;
  url: string;
  country?: string;
}

/** Returns true if a handle field is missing or still a TODO placeholder */
export function isTodoValue(value?: string | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.toUpperCase().startsWith('TODO');
}

/** Builds the canonical watch/channel URL for a platform handle */
export function buildPlatformUrl(platform: Platform, handle: string, videoId?: string): string {
  switch (platform) {
    case 'youtube':
      if (videoId) return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
      return `https://www.youtube.com/channel/${encodeURIComponent(handle)}`;
    case 'twitch':
      return `https://www.twitch.tv/${encodeURIComponent(handle)}`;
    case 'kick':
      return `https://kick.com/${encodeURIComponent(handle)}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${encodeURIComponent(handle.replace(/^@/, ''))}`;
  }
}

export function formatViewerCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count >= 1_000_000) {
    const val = (count / 1_000_000).toFixed(1);
    return `${val.endsWith('.0') ? val.slice(0, -2) : val}M`;
  }
  if (count >= 1_000) {
    const val = (count / 1_000).toFixed(1);
    return `${val.endsWith('.0') ? val.slice(0, -2) : val}K`;
  }
  return count.toLocaleString('en-US');
}

export function formatRelativeUpdated(isoTimestamp: string, nowMs: number = Date.now()): string {
  const updatedMs = Date.parse(isoTimestamp);
  if (Number.isNaN(updatedMs)) return 'Updated just now';
  const diffSeconds = Math.max(0, Math.floor((nowMs - updatedMs) / 1000));
  if (diffSeconds < 45) return 'Updated just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes === 1) return 'Updated 1 min ago';
  if (diffMinutes < 60) return `Updated ${diffMinutes} mins ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return diffHours === 1 ? 'Updated 1 hr ago' : `Updated ${diffHours} hrs ago`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getPlatformLabel(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'twitch':
      return 'Twitch';
    case 'kick':
      return 'Kick';
    case 'tiktok':
      return 'TikTok';
  }
}

function normalizeHandle(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, '');
}

/**
 * Matches discovered platform streams against curated streamers and merges
 * multi-platform live streams into a single DirectoryStreamer card.
 */
export function mergeLiveStreams(
  curated: CuratedStreamer[],
  discovered: DiscoveredStreamInput[]
): DirectoryStreamer[] {
  const curatedById = new Map<string, CuratedStreamer>();
  const curatedByPlatformHandle = new Map<string, string>();

  for (const person of curated) {
    curatedById.set(person.id, person);
    if (!isTodoValue(person.youtubeChannelId)) {
      curatedByPlatformHandle.set(`youtube:${normalizeHandle(person.youtubeChannelId)}`, person.id);
    }
    if (!isTodoValue(person.twitchLogin)) {
      curatedByPlatformHandle.set(`twitch:${normalizeHandle(person.twitchLogin)}`, person.id);
    }
    if (!isTodoValue(person.kickSlug)) {
      curatedByPlatformHandle.set(`kick:${normalizeHandle(person.kickSlug)}`, person.id);
    }
  }

  const grouped = new Map<string, DirectoryStreamer>();

  for (const item of discovered) {
    const handleKey = `${item.platform}:${normalizeHandle(item.channelHandle)}`;
    const matchedCuratedId = curatedByPlatformHandle.get(handleKey);
    const curatedPerson = matchedCuratedId ? curatedById.get(matchedCuratedId) : undefined;

    const groupKey = curatedPerson
      ? `curated:${curatedPerson.id}`
      : `discovered:${item.platform}:${normalizeHandle(item.channelHandle)}`;

    const platformStream: PlatformStream = {
      platform: item.platform,
      url: item.url,
      title: item.title,
      viewerCount: Math.max(0, Math.round(item.viewerCount || 0)),
      startedAt: item.startedAt,
      thumbnailUrl: item.thumbnailUrl,
      channelHandle: item.channelHandle,
      isLive: true,
    };

    const existing = grouped.get(groupKey);
    if (!existing) {
      grouped.set(groupKey, {
        id: curatedPerson ? curatedPerson.id : `${item.platform}-${normalizeHandle(item.channelHandle)}`,
        displayName: curatedPerson ? curatedPerson.displayName : item.displayName,
        avatarUrl: curatedPerson?.avatarUrl || item.avatarUrl || '',
        featured: curatedPerson?.featured ?? false,
        country: curatedPerson?.country || item.country || 'GLOBAL',
        isLive: true,
        totalViewers: platformStream.viewerCount,
        latestStartedAt: platformStream.startedAt,
        platforms: [platformStream],
        primaryTitle: platformStream.title,
        thumbnailUrl: platformStream.thumbnailUrl,
        isCurated: Boolean(curatedPerson),
      });
    } else {
      // Avoid duplicate entries for the same platform
      const alreadyHasPlatform = existing.platforms.some(
        (p) => p.platform === platformStream.platform
      );
      if (!alreadyHasPlatform) {
        existing.platforms.push(platformStream);
        existing.platforms.sort((a, b) => b.viewerCount - a.viewerCount);
        existing.totalViewers += platformStream.viewerCount;
        if (!existing.avatarUrl && item.avatarUrl) {
          existing.avatarUrl = item.avatarUrl;
        }
        if (!existing.thumbnailUrl && platformStream.thumbnailUrl) {
          existing.thumbnailUrl = platformStream.thumbnailUrl;
        }
        if (platformStream.startedAt) {
          if (
            !existing.latestStartedAt ||
            Date.parse(platformStream.startedAt) > Date.parse(existing.latestStartedAt)
          ) {
            existing.latestStartedAt = platformStream.startedAt;
          }
        }
        // Primary title comes from the highest-viewer platform
        existing.primaryTitle = existing.platforms[0]?.title || existing.primaryTitle;
        if (existing.platforms[0]?.thumbnailUrl) {
          existing.thumbnailUrl = existing.platforms[0].thumbnailUrl;
        }
      }
    }
  }

  return Array.from(grouped.values());
}

/** Builds muted offline entries for curated streamers who are not live right now */
export function buildOfflineCurated(
  curated: CuratedStreamer[],
  liveStreamers: DirectoryStreamer[]
): DirectoryStreamer[] {
  const liveIds = new Set(liveStreamers.map((s) => s.id));
  const offline: DirectoryStreamer[] = [];

  for (const person of curated) {
    if (liveIds.has(person.id)) continue;

    const channels: PlatformStream[] = [];
    if (!isTodoValue(person.twitchLogin)) {
      channels.push({
        platform: 'twitch',
        url: buildPlatformUrl('twitch', person.twitchLogin),
        title: 'Twitch Channel',
        viewerCount: 0,
        startedAt: null,
        channelHandle: person.twitchLogin,
        isLive: false,
      });
    }
    if (!isTodoValue(person.youtubeChannelId)) {
      channels.push({
        platform: 'youtube',
        url: buildPlatformUrl('youtube', person.youtubeChannelId),
        title: 'YouTube Channel',
        viewerCount: 0,
        startedAt: null,
        channelHandle: person.youtubeChannelId,
        isLive: false,
      });
    }
    if (!isTodoValue(person.kickSlug)) {
      channels.push({
        platform: 'kick',
        url: buildPlatformUrl('kick', person.kickSlug),
        title: 'Kick Channel',
        viewerCount: 0,
        startedAt: null,
        channelHandle: person.kickSlug,
        isLive: false,
      });
    }
    if (!isTodoValue(person.tiktokUsername)) {
      channels.push({
        platform: 'tiktok',
        url: buildPlatformUrl('tiktok', person.tiktokUsername),
        title: 'TikTok Profile',
        viewerCount: 0,
        startedAt: null,
        channelHandle: person.tiktokUsername,
        isLive: false,
        checkOnly: true,
      });
    }

    offline.push({
      id: person.id,
      displayName: person.displayName,
      avatarUrl: person.avatarUrl || '',
      featured: person.featured,
      country: person.country,
      isLive: false,
      totalViewers: 0,
      latestStartedAt: null,
      platforms: channels,
      primaryTitle: 'Currently offline',
      isCurated: true,
    });
  }

  return offline;
}

/** Builds curated TikTok creator profiles with no live-status claims */
export function buildTiktokCreators(curated: CuratedStreamer[]): DirectoryStreamer[] {
  const creators: DirectoryStreamer[] = [];

  for (const person of curated) {
    if (isTodoValue(person.tiktokUsername)) continue;
    creators.push({
      id: `${person.id}-tiktok`,
      displayName: person.displayName,
      avatarUrl: person.avatarUrl || '',
      featured: person.featured,
      country: person.country,
      isLive: false,
      totalViewers: 0,
      latestStartedAt: null,
      platforms: [
        {
          platform: 'tiktok',
          url: buildPlatformUrl('tiktok', person.tiktokUsername),
          title: `@${person.tiktokUsername.replace(/^@/, '')}`,
          viewerCount: 0,
          startedAt: null,
          channelHandle: person.tiktokUsername,
          isLive: false,
          checkOnly: true,
        },
      ],
      primaryTitle: 'TikTok creator profile',
      isCurated: true,
    });
  }

  return creators;
}

export interface FilterSortOptions {
  platform: PlatformFilter;
  search: string;
  sort: SortOption;
}

/** Filters and sorts directory streamers instantaneously on the client */
export function filterAndSortStreamers(
  streamers: DirectoryStreamer[],
  { platform, search, sort }: FilterSortOptions
): DirectoryStreamer[] {
  const query = search.trim().toLowerCase();

  const filtered = streamers.filter((streamer) => {
    const matchesPlatform =
      platform === 'all' || streamer.platforms.some((p) => p.platform === platform);

    if (!matchesPlatform) return false;
    if (!query) return true;

    const hay = `${streamer.displayName} ${streamer.primaryTitle} ${streamer.country}`.toLowerCase();
    return hay.includes(query);
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'newest') {
      const aTime = a.latestStartedAt ? Date.parse(a.latestStartedAt) : 0;
      const bTime = b.latestStartedAt ? Date.parse(b.latestStartedAt) : 0;
      if (bTime !== aTime) return bTime - aTime;
      return b.totalViewers - a.totalViewers;
    }

    // Default: most viewers
    if (b.totalViewers !== a.totalViewers) return b.totalViewers - a.totalViewers;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
}
