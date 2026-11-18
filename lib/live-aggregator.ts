import curatedStreamersRaw from '../streamers.json';
import { APP_CONFIG } from './config';
import {
  buildOfflineCurated,
  buildPlatformUrl,
  buildTiktokCreators,
  isTodoValue,
  mergeLiveStreams,
  type DiscoveredStreamInput,
} from './stream-utils';
import type {
  CuratedStreamer,
  LiveApiResponse,
  Platform,
  PlatformApiStatus,
} from './types';

const curatedStreamers: CuratedStreamer[] = curatedStreamersRaw as CuratedStreamer[];

const FETCH_TIMEOUT_MS = 5_000;

interface TwitchTokenCache {
  token: string;
  expiresAtMs: number;
}

interface TwitchGameCache {
  gameId: string;
  expiresAtMs: number;
}

interface YouTubeDiscoveryCache {
  streams: DiscoveredStreamInput[];
  expiresAtMs: number;
}

let twitchTokenCache: TwitchTokenCache | null = null;
let twitchGameCache: TwitchGameCache | null = null;
let ytDiscoveryCache: YouTubeDiscoveryCache | null = null;

async function fetchJsonWithTimeout<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getTwitchAppToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (twitchTokenCache && twitchTokenCache.expiresAtMs > now) {
    return twitchTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const data = await fetchJsonWithTimeout<{ access_token: string; expires_in: number }>(
    'https://id.twitch.tv/oauth2/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  );

  twitchTokenCache = {
    token: data.access_token,
    expiresAtMs: now + Math.max(60, data.expires_in - 120) * 1000,
  };
  return data.access_token;
}

interface TwitchStreamRow {
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

interface TwitchUserRow {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

async function fetchTwitchLiveStreams(): Promise<{
  streams: DiscoveredStreamInput[];
  status: PlatformApiStatus;
}> {
  const clientId = process.env.TWITCH_CLIENT_ID?.trim();
  const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { streams: [], status: 'degraded' };
  }

  try {
    const token = await getTwitchAppToken(clientId, clientSecret);
    const headers = {
      'Client-Id': clientId,
      Authorization: `Bearer ${token}`,
    };

    // 1. Lookup GTA VI category ID (cached for 1 hour)
    let gameId =
      twitchGameCache && twitchGameCache.expiresAtMs > Date.now()
        ? twitchGameCache.gameId
        : '';

    if (!gameId) {
      const gameRes = await fetchJsonWithTimeout<{ data: Array<{ id: string; name: string }> }>(
        `https://api.twitch.tv/helix/games?name=${encodeURIComponent(APP_CONFIG.TARGET_GAME_TITLE)}`,
        { headers }
      );
      gameId = gameRes.data?.[0]?.id || '';
      if (gameId) {
        twitchGameCache = { gameId, expiresAtMs: Date.now() + 3_600_000 };
      }
    }

    const collected = new Map<string, TwitchStreamRow>();

    // 2. Top live streams in the GTA VI category
    if (gameId) {
      const categoryRes = await fetchJsonWithTimeout<{ data: TwitchStreamRow[] }>(
        `https://api.twitch.tv/helix/streams?game_id=${encodeURIComponent(gameId)}&first=40`,
        { headers }
      );
      for (const row of categoryRes.data || []) {
        collected.set(row.user_login.toLowerCase(), row);
      }
    }

    // 3. Also explicitly check curated Twitch logins (batched up to 100)
    const curatedLogins = curatedStreamers
      .map((s) => s.twitchLogin)
      .filter((login) => !isTodoValue(login));

    if (curatedLogins.length > 0) {
      const params = new URLSearchParams();
      for (const login of curatedLogins.slice(0, 100)) {
        params.append('user_login', login.toLowerCase());
      }
      const curatedRes = await fetchJsonWithTimeout<{ data: TwitchStreamRow[] }>(
        `https://api.twitch.tv/helix/streams?${params.toString()}`,
        { headers }
      );
      for (const row of curatedRes.data || []) {
        collected.set(row.user_login.toLowerCase(), row);
      }
    }

    const rows = Array.from(collected.values());
    if (rows.length === 0) {
      return { streams: [], status: 'ok' };
    }

    // 4. Hydrate channel avatars in one batched Helix users request
    const avatarMap = new Map<string, string>();
    const userParams = new URLSearchParams();
    for (const row of rows.slice(0, 100)) {
      userParams.append('login', row.user_login.toLowerCase());
    }
    try {
      const usersRes = await fetchJsonWithTimeout<{ data: TwitchUserRow[] }>(
        `https://api.twitch.tv/helix/users?${userParams.toString()}`,
        { headers }
      );
      for (const user of usersRes.data || []) {
        avatarMap.set(user.login.toLowerCase(), user.profile_image_url);
      }
    } catch {
      // Avatar hydration is non-critical
    }

    const streams: DiscoveredStreamInput[] = rows.map((row) => ({
      platform: 'twitch',
      channelHandle: row.user_login,
      displayName: row.user_name,
      avatarUrl: avatarMap.get(row.user_login.toLowerCase()) || '',
      title: row.title || `${row.user_name} live on Twitch`,
      viewerCount: row.viewer_count || 0,
      startedAt: row.started_at || null,
      thumbnailUrl: row.thumbnail_url
        ? row.thumbnail_url.replace('{width}', '480').replace('{height}', '270')
        : undefined,
      url: buildPlatformUrl('twitch', row.user_login),
    }));

    return { streams, status: 'ok' };
  } catch (err) {
    console.warn('[Leonida Live] Twitch fetch degraded:', err instanceof Error ? err.message : err);
    return { streams: [], status: 'degraded' };
  }
}

interface YouTubeVideoItem {
  id: string;
  snippet?: {
    channelId?: string;
    channelTitle?: string;
    title?: string;
    liveBroadcastContent?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  liveStreamingDetails?: {
    concurrentViewers?: string;
    actualStartTime?: string;
  };
}

async function fetchYouTubeLiveStreams(): Promise<{
  streams: DiscoveredStreamInput[];
  status: PlatformApiStatus;
}> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    return { streams: [], status: 'degraded' };
  }

  try {
    const curatedChannelIds = curatedStreamers
      .map((s) => s.youtubeChannelId)
      .filter((id) => !isTodoValue(id));

    const candidateVideoIds = new Set<string>();
    const channelAvatars = new Map<string, string>();

    // 1. Curated channels via uploads playlist (quota-friendly: avoids search.list)
    if (curatedChannelIds.length > 0) {
      const chParams = new URLSearchParams({
        part: 'contentDetails,snippet',
        id: curatedChannelIds.slice(0, 50).join(','),
        key: apiKey,
      });
      const chRes = await fetchJsonWithTimeout<{
        items?: Array<{
          id: string;
          snippet?: { thumbnails?: { default?: { url?: string } } };
          contentDetails?: { relatedPlaylists?: { uploads?: string } };
        }>;
      }>(`https://www.googleapis.com/youtube/v3/channels?${chParams.toString()}`);

      const playlistIds: string[] = [];
      for (const ch of chRes.items || []) {
        const avatar = ch.snippet?.thumbnails?.default?.url;
        if (avatar) channelAvatars.set(ch.id, avatar);
        const uploads =
          ch.contentDetails?.relatedPlaylists?.uploads ||
          (ch.id.startsWith('UC') ? `UU${ch.id.slice(2)}` : '');
        if (uploads) playlistIds.push(uploads);
      }

      const playlistResults = await Promise.allSettled(
        playlistIds.map((playlistId) =>
          fetchJsonWithTimeout<{
            items?: Array<{
              snippet?: { resourceId?: { videoId?: string }; liveBroadcastContent?: string };
            }>;
          }>(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(
              playlistId
            )}&maxResults=3&key=${encodeURIComponent(apiKey)}`
          )
        )
      );

      for (const res of playlistResults) {
        if (res.status !== 'fulfilled') continue;
        for (const item of res.value.items || []) {
          const vid = item.snippet?.resourceId?.videoId;
          if (vid) candidateVideoIds.add(vid);
        }
      }
    }

    // 2. Hydrate curated candidate videos in ONE batched videos.list request
    const curatedStreams: DiscoveredStreamInput[] = [];
    if (candidateVideoIds.size > 0) {
      const vidParams = new URLSearchParams({
        part: 'liveStreamingDetails,snippet',
        id: Array.from(candidateVideoIds).slice(0, 50).join(','),
        key: apiKey,
      });
      const vidRes = await fetchJsonWithTimeout<{ items?: YouTubeVideoItem[] }>(
        `https://www.googleapis.com/youtube/v3/videos?${vidParams.toString()}`
      );
      for (const item of vidRes.items || []) {
        if (item.snippet?.liveBroadcastContent !== 'live') continue;
        const channelId = item.snippet?.channelId || '';
        const viewers = Number(item.liveStreamingDetails?.concurrentViewers || 0);
        curatedStreams.push({
          platform: 'youtube',
          channelHandle: channelId,
          displayName: item.snippet?.channelTitle || 'YouTube Creator',
          avatarUrl: channelAvatars.get(channelId) || '',
          title: item.snippet?.title || 'Live on YouTube',
          viewerCount: Number.isFinite(viewers) ? viewers : 0,
          startedAt: item.liveStreamingDetails?.actualStartTime || null,
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
          url: buildPlatformUrl('youtube', channelId, item.id),
        });
      }
    }

    // 3. Discovery search: max 1 search.list call every 10 minutes shared across all visitors
    const now = Date.now();
    let discoveredStreams: DiscoveredStreamInput[] = [];
    if (ytDiscoveryCache && ytDiscoveryCache.expiresAtMs > now) {
      discoveredStreams = ytDiscoveryCache.streams;
    } else {
      try {
        const searchParams = new URLSearchParams({
          part: 'snippet',
          eventType: 'live',
          type: 'video',
          q: APP_CONFIG.TARGET_GAME_TITLE,
          maxResults: '16',
          order: 'viewCount',
          key: apiKey,
        });
        const searchRes = await fetchJsonWithTimeout<{
          items?: Array<{ id?: { videoId?: string } }>;
        }>(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);

        const foundIds = (searchRes.items || [])
          .map((item) => item.id?.videoId)
          .filter((id): id is string => Boolean(id));

        if (foundIds.length > 0) {
          const batchParams = new URLSearchParams({
            part: 'liveStreamingDetails,snippet',
            id: foundIds.join(','),
            key: apiKey,
          });
          const batchRes = await fetchJsonWithTimeout<{ items?: YouTubeVideoItem[] }>(
            `https://www.googleapis.com/youtube/v3/videos?${batchParams.toString()}`
          );
          discoveredStreams = (batchRes.items || [])
            .filter((item) => item.snippet?.liveBroadcastContent === 'live')
            .map((item) => {
              const channelId = item.snippet?.channelId || '';
              const viewers = Number(item.liveStreamingDetails?.concurrentViewers || 0);
              return {
                platform: 'youtube' as const,
                channelHandle: channelId,
                displayName: item.snippet?.channelTitle || 'YouTube Streamer',
                avatarUrl: '',
                title: item.snippet?.title || 'Live on YouTube',
                viewerCount: Number.isFinite(viewers) ? viewers : 0,
                startedAt: item.liveStreamingDetails?.actualStartTime || null,
                thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
                url: buildPlatformUrl('youtube', channelId, item.id),
              };
            });
        }

        ytDiscoveryCache = {
          streams: discoveredStreams,
          expiresAtMs: now + APP_CONFIG.YOUTUBE_DISCOVERY_CACHE_SECONDS * 1000,
        };
      } catch (searchErr) {
        console.warn(
          '[Leonida Live] YouTube discovery search skipped:',
          searchErr instanceof Error ? searchErr.message : searchErr
        );
        discoveredStreams = ytDiscoveryCache?.streams || [];
      }
    }

    const byKey = new Map<string, DiscoveredStreamInput>();
    for (const s of [...curatedStreams, ...discoveredStreams]) {
      byKey.set(s.channelHandle.toLowerCase(), s);
    }

    return { streams: Array.from(byKey.values()), status: 'ok' };
  } catch (err) {
    console.warn('[Leonida Live] YouTube fetch degraded:', err instanceof Error ? err.message : err);
    return { streams: [], status: 'degraded' };
  }
}

async function fetchKickLiveStreams(): Promise<{
  streams: DiscoveredStreamInput[];
  status: PlatformApiStatus;
}> {
  const kickClientId = process.env.KICK_CLIENT_ID?.trim();
  const kickClientSecret = process.env.KICK_CLIENT_SECRET?.trim();
  if (!kickClientId || !kickClientSecret) {
    return { streams: [], status: 'degraded' };
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: kickClientId,
      client_secret: kickClientSecret,
    });
    const tokenRes = await fetchJsonWithTimeout<{ access_token: string }>(
      'https://id.kick.com/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.toString(),
      }
    );

    const headers = {
      Authorization: `Bearer ${tokenRes.access_token}`,
      Accept: 'application/json',
    };

    const kickSlugs = curatedStreamers
      .map((s) => s.kickSlug)
      .filter((slug) => !isTodoValue(slug));

    const streams: DiscoveredStreamInput[] = [];
    if (kickSlugs.length > 0) {
      const slugParams = new URLSearchParams();
      for (const slug of kickSlugs) slugParams.append('slug', slug);
      const channelsRes = await fetchJsonWithTimeout<{
        data?: Array<{
          slug: string;
          stream_title?: string;
          stream?: {
            is_live?: boolean;
            viewer_count?: number;
            start_time?: string;
            thumbnail?: string;
          };
          user?: { username?: string; profile_picture?: string };
        }>;
      }>(`https://api.kick.com/public/v1/channels?${slugParams.toString()}`, { headers });

      for (const ch of channelsRes.data || []) {
        if (!ch.stream?.is_live) continue;
        streams.push({
          platform: 'kick',
          channelHandle: ch.slug,
          displayName: ch.user?.username || ch.slug,
          avatarUrl: ch.user?.profile_picture || '',
          title: ch.stream_title || `${ch.slug} live on Kick`,
          viewerCount: ch.stream.viewer_count || 0,
          startedAt: ch.stream.start_time || null,
          thumbnailUrl: ch.stream.thumbnail,
          url: buildPlatformUrl('kick', ch.slug),
        });
      }
    }

    return { streams, status: 'ok' };
  } catch (err) {
    console.warn('[Leonida Live] Kick fetch degraded:', err instanceof Error ? err.message : err);
    return { streams: [], status: 'degraded' };
  }
}

/** Realistic Demo Mode dataset when no API keys are present */
export function buildDemoLiveResponse(nowIso: string = new Date().toISOString()): LiveApiResponse {
  const nowMs = Date.parse(nowIso);
  const minsAgo = (m: number) => new Date(nowMs - m * 60_000).toISOString();

  const demoStreams: DiscoveredStreamInput[] = [
    // Kai Cenat — multi-platform (Twitch + YouTube)
    {
      platform: 'twitch',
      channelHandle: 'kaicenat',
      displayName: 'Kai Cenat',
      title: 'LEONIDA LAUNCH MARATHON — 24HR VICE COAST STORY RUN',
      viewerCount: 118400,
      startedAt: minsAgo(42),
      thumbnailUrl: '/images/thumb_causeway_drift.jpg',
      url: buildPlatformUrl('twitch', 'kaicenat'),
    },
    {
      platform: 'youtube',
      channelHandle: 'UC_DEMO_KAI_YT',
      displayName: 'Kai Cenat',
      title: 'LEONIDA LAUNCH MARATHON — YOUTUBE SIMULCAST',
      viewerCount: 41200,
      startedAt: minsAgo(40),
      thumbnailUrl: '/images/thumb_causeway_drift.jpg',
      url: 'https://www.youtube.com/@KaiCenat',
    },
    // IShowSpeed — multi-platform (YouTube + Twitch)
    {
      platform: 'youtube',
      channelHandle: 'UCWsDFcIhY2DBi3GB5uykGFw',
      displayName: 'IShowSpeed',
      title: 'FIRST TIME DRIVING ACROSS LEONIDA KEYS!! INSANE SPEED',
      viewerCount: 94600,
      startedAt: minsAgo(18),
      thumbnailUrl: '/images/thumb_downtown_neon.jpg',
      url: buildPlatformUrl('youtube', 'UCWsDFcIhY2DBi3GB5uykGFw'),
    },
    {
      platform: 'twitch',
      channelHandle: 'ishowspeed',
      displayName: 'IShowSpeed',
      title: 'SPEED IN VICE CITY KEYS — LIVE CHAOS',
      viewerCount: 28900,
      startedAt: minsAgo(16),
      thumbnailUrl: '/images/thumb_downtown_neon.jpg',
      url: buildPlatformUrl('twitch', 'ishowspeed'),
    },
    // Adin Ross — Kick
    {
      platform: 'kick',
      channelHandle: 'adinross',
      displayName: 'Adin Ross',
      title: 'LATE NIGHT HEISTS & SUPERCAR WAGER LOBBIES',
      viewerCount: 62500,
      startedAt: minsAgo(65),
      thumbnailUrl: '/images/thumb_marina_heist.jpg',
      url: buildPlatformUrl('kick', 'adinross'),
    },
    // VanossGaming — YouTube
    {
      platform: 'youtube',
      channelHandle: 'UCKqH_9mk1waLgBiL2vT5b9g',
      displayName: 'VanossGaming',
      title: 'Vanoss Crew Sandbox Chaos — Yacht Escapes & Stunts',
      viewerCount: 48300,
      startedAt: minsAgo(95),
      thumbnailUrl: '/images/thumb_rooftop_vista.jpg',
      url: buildPlatformUrl('youtube', 'UCKqH_9mk1waLgBiL2vT5b9g'),
    },
    // Stable Ronaldo — Twitch
    {
      platform: 'twitch',
      channelHandle: 'stableronaldo',
      displayName: 'Stable Ronaldo',
      title: 'Faze House Co-Op Campaign + Coastal Drift Racing',
      viewerCount: 31700,
      startedAt: minsAgo(27),
      thumbnailUrl: '/images/thumb_causeway_drift.jpg',
      url: buildPlatformUrl('twitch', 'stableronaldo'),
    },
    // Marlon — Twitch
    {
      platform: 'twitch',
      channelHandle: 'marlon',
      displayName: 'Marlon',
      title: 'Exploring Downtown Leonida Rain & Nightlife Secrets',
      viewerCount: 19400,
      startedAt: minsAgo(53),
      thumbnailUrl: '/images/thumb_downtown_neon.jpg',
      url: buildPlatformUrl('twitch', 'marlon'),
    },
    // Kenyan Streamers (KE)
    {
      platform: 'twitch',
      channelHandle: 'chebetplays',
      displayName: 'Chebet Plays',
      title: 'Nairobi to Leonida: First Story Missions & No Hud',
      viewerCount: 4850,
      startedAt: minsAgo(11),
      thumbnailUrl: '/images/thumb_rooftop_vista.jpg',
      url: buildPlatformUrl('twitch', 'chebetplays'),
      country: 'KE',
    },
    {
      platform: 'twitch',
      channelHandle: 'nairobinight',
      displayName: 'Nairobi Night',
      title: '254 Squad Marina Heist — Come Vibe in Chat',
      viewerCount: 3420,
      startedAt: minsAgo(8),
      thumbnailUrl: '/images/thumb_marina_heist.jpg',
      url: buildPlatformUrl('twitch', 'nairobinight'),
      country: 'KE',
    },
    {
      platform: 'kick',
      channelHandle: 'nairobinight',
      displayName: 'Nairobi Night',
      title: '254 Squad Marina Heist — Kick Simulcast',
      viewerCount: 1280,
      startedAt: minsAgo(8),
      thumbnailUrl: '/images/thumb_marina_heist.jpg',
      url: buildPlatformUrl('kick', 'nairobinight'),
      country: 'KE',
    },
    {
      platform: 'kick',
      channelHandle: 'kiproplive',
      displayName: 'Kiprop Live',
      title: 'Rift Valley Crew: Midnight Causeway Time Trials',
      viewerCount: 2190,
      startedAt: minsAgo(33),
      thumbnailUrl: '/images/thumb_causeway_drift.jpg',
      url: buildPlatformUrl('kick', 'kiproplive'),
      country: 'KE',
    },
    // Discovered community streamers
    {
      platform: 'twitch',
      channelHandle: 'vicecoastdriver',
      displayName: 'ViceCoastDriver',
      title: 'Full Map Highway Circuit & Secret Garages Hunt',
      viewerCount: 8940,
      startedAt: minsAgo(14),
      thumbnailUrl: '/images/thumb_causeway_drift.jpg',
      url: buildPlatformUrl('twitch', 'vicecoastdriver'),
    },
    {
      platform: 'youtube',
      channelHandle: 'UC_SUNSET_GAMES',
      displayName: 'Sunset City RP',
      title: '100% Exploration: Every Pier, Rooftop & Alleyway',
      viewerCount: 6720,
      startedAt: minsAgo(74),
      thumbnailUrl: '/images/thumb_rooftop_vista.jpg',
      url: 'https://www.youtube.com/@SunsetCityRP',
    },
    {
      platform: 'kick',
      channelHandle: 'neonharbor',
      displayName: 'NeonHarbor',
      title: 'Speedboat Chase Challenges on Sunset Bay',
      viewerCount: 4110,
      startedAt: minsAgo(22),
      thumbnailUrl: '/images/thumb_marina_heist.jpg',
      url: buildPlatformUrl('kick', 'neonharbor'),
    },
  ];

  // Note: Kai Cenat's demo YouTube channel is matched by handle or merged manually for demo showcase
  const curatedWithDemoYt = curatedStreamers.map((c) =>
    c.id === 'kai-cenat' ? { ...c, youtubeChannelId: 'UC_DEMO_KAI_YT' } : c
  );

  const liveStreamers = mergeLiveStreams(curatedWithDemoYt, demoStreams);
  const offlineCurated = buildOfflineCurated(curatedStreamers, liveStreamers);
  const tiktokCreators = buildTiktokCreators(curatedStreamers);

  return {
    liveStreamers,
    offlineCurated,
    tiktokCreators,
    totalLiveCount: liveStreamers.length,
    updatedAt: nowIso,
    isDemoData: true,
    platformStatus: {
      youtube: 'demo',
      twitch: 'demo',
      kick: 'demo',
      tiktok: 'static',
    },
  };
}

export async function getLiveDirectory(): Promise<LiveApiResponse> {
  const hasTwitch = Boolean(process.env.TWITCH_CLIENT_ID?.trim() && process.env.TWITCH_CLIENT_SECRET?.trim());
  const hasYouTube = Boolean(process.env.YOUTUBE_API_KEY?.trim());
  const hasKick = Boolean(process.env.KICK_CLIENT_ID?.trim() && process.env.KICK_CLIENT_SECRET?.trim());

  // Automatically enter Demo Mode when no live platform API keys are configured
  if (!hasTwitch && !hasYouTube && !hasKick) {
    return buildDemoLiveResponse();
  }

  const [twitchRes, youtubeRes, kickRes] = await Promise.all([
    hasTwitch ? fetchTwitchLiveStreams() : Promise.resolve({ streams: [], status: 'degraded' as const }),
    hasYouTube ? fetchYouTubeLiveStreams() : Promise.resolve({ streams: [], status: 'degraded' as const }),
    hasKick ? fetchKickLiveStreams() : Promise.resolve({ streams: [], status: 'degraded' as const }),
  ]);

  const allDiscovered = [...twitchRes.streams, ...youtubeRes.streams, ...kickRes.streams];
  const liveStreamers = mergeLiveStreams(curatedStreamers, allDiscovered);
  const offlineCurated = buildOfflineCurated(curatedStreamers, liveStreamers);
  const tiktokCreators = buildTiktokCreators(curatedStreamers);

  const platformStatus: Record<Platform, PlatformApiStatus> = {
    twitch: hasTwitch ? twitchRes.status : 'degraded',
    youtube: hasYouTube ? youtubeRes.status : 'degraded',
    kick: hasKick ? kickRes.status : 'degraded',
    tiktok: 'static',
  };

  return {
    liveStreamers,
    offlineCurated,
    tiktokCreators,
    totalLiveCount: liveStreamers.length,
    updatedAt: new Date().toISOString(),
    isDemoData: false,
    platformStatus,
  };
}

export const LIVE_RESPONSE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': `public, max-age=30, s-maxage=${APP_CONFIG.TWITCH_KICK_CACHE_SECONDS}, stale-while-revalidate=30`,
  'Netlify-CDN-Cache-Control': `public, s-maxage=${APP_CONFIG.TWITCH_KICK_CACHE_SECONDS}, stale-while-revalidate=120`,
} as const;
