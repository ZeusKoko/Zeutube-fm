export type Platform = 'youtube' | 'twitch' | 'kick' | 'tiktok';

export type PlatformFilter = 'all' | Platform;

export type SortOption = 'viewers' | 'newest';

export interface CuratedStreamer {
  id: string;
  displayName: string;
  avatarUrl: string;
  featured: boolean;
  country: string;
  youtubeChannelId: string;
  twitchLogin: string;
  kickSlug: string;
  tiktokUsername: string;
}

export interface PlatformStream {
  platform: Platform;
  url: string;
  title: string;
  viewerCount: number;
  startedAt: string | null;
  thumbnailUrl?: string;
  channelHandle: string;
  isLive: boolean;
  /** True for TikTok curated profiles where live API status cannot be verified */
  checkOnly?: boolean;
}

export interface DirectoryStreamer {
  id: string;
  displayName: string;
  avatarUrl: string;
  featured: boolean;
  country: string;
  isLive: boolean;
  totalViewers: number;
  latestStartedAt: string | null;
  platforms: PlatformStream[];
  primaryTitle: string;
  thumbnailUrl?: string;
  isCurated: boolean;
}

export type PlatformApiStatus = 'ok' | 'degraded' | 'demo' | 'static';

export interface LiveApiResponse {
  liveStreamers: DirectoryStreamer[];
  offlineCurated: DirectoryStreamer[];
  tiktokCreators: DirectoryStreamer[];
  totalLiveCount: number;
  updatedAt: string;
  isDemoData: boolean;
  platformStatus: Record<Platform, PlatformApiStatus>;
}
