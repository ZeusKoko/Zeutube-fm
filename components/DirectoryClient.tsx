'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, RotateCcw, Tv } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { filterAndSortStreamers } from '@/lib/stream-utils';
import type { LiveApiResponse, PlatformFilter, SortOption } from '@/lib/types';
import FilterToolbar from './FilterToolbar';
import HeroHeader from './HeroHeader';
import Navbar from './Navbar';
import OfflineRow from './OfflineRow';
import SkeletonGrid from './SkeletonGrid';
import StreamerCard from './StreamerCard';
import TikTokCard from './TikTokCard';

// In-memory client cache so switching tabs or remounting never refetches unnecessarily
let cachedDirectoryResponse: LiveApiResponse | null = null;

export default function DirectoryClient() {
  const [data, setData] = useState<LiveApiResponse | null>(() => cachedDirectoryResponse);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedDirectoryResponse);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('viewers');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const kenyanSectionRef = useRef<HTMLElement | null>(null);

  const fetchLive = useCallback(async (isBackgroundRefresh: boolean) => {
    try {
      const res = await fetch('/api/live', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as LiveApiResponse;
      cachedDirectoryResponse = json;
      setData(json);
      setFetchError(false);
      setNowMs(Date.now());
    } catch {
      // Never wipe existing live cards during a quiet background refresh
      if (!isBackgroundRefresh && !cachedDirectoryResponse) {
        setFetchError(true);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDirectory(isBackgroundRefresh: boolean) {
      try {
        const res = await fetch('/api/live', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as LiveApiResponse;
        if (!active) return;
        cachedDirectoryResponse = json;
        setData(json);
        setFetchError(false);
        setNowMs(Date.now());
      } catch {
        if (!active) return;
        if (!isBackgroundRefresh && !cachedDirectoryResponse) {
          setFetchError(true);
        }
      } finally {
        if (active && !isBackgroundRefresh) {
          setIsLoading(false);
        }
      }
    }

    void loadDirectory(Boolean(cachedDirectoryResponse));

    const pollTimer = setInterval(() => {
      void loadDirectory(true);
    }, APP_CONFIG.REFRESH_INTERVAL_MS);

    const clockTimer = setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);

    return () => {
      active = false;
      clearInterval(pollTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const platformCounts = useMemo<Record<PlatformFilter, number>>(() => {
    if (!data) {
      return { all: 0, youtube: 0, twitch: 0, kick: 0, tiktok: 0 };
    }
    const live = data.liveStreamers;
    return {
      all: live.length,
      youtube: live.filter((s) => s.platforms.some((p) => p.platform === 'youtube')).length,
      twitch: live.filter((s) => s.platforms.some((p) => p.platform === 'twitch')).length,
      kick: live.filter((s) => s.platforms.some((p) => p.platform === 'kick')).length,
      tiktok: data.tiktokCreators.length,
    };
  }, [data]);

  const filteredLive = useMemo(() => {
    if (!data || platform === 'tiktok') return [];
    return filterAndSortStreamers(data.liveStreamers, {
      platform,
      search,
      sort,
    });
  }, [data, platform, search, sort]);

  const filteredFeatured = useMemo(
    () => filteredLive.filter((s) => s.featured),
    [filteredLive]
  );

  const filteredKenyan = useMemo(
    () => filteredLive.filter((s) => s.country === 'KE'),
    [filteredLive]
  );

  const filteredTiktok = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.tiktokCreators;
    return data.tiktokCreators.filter((c) =>
      `${c.displayName} ${c.country}`.toLowerCase().includes(q)
    );
  }, [data, search]);

  const filteredOffline = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.offlineCurated;
    return data.offlineCurated.filter((s) =>
      `${s.displayName} ${s.country}`.toLowerCase().includes(q)
    );
  }, [data, search]);

  const isTikTokTab = platform === 'tiktok';
  const visibleCount = isTikTokTab ? filteredTiktok.length : filteredLive.length;

  const handleJumpKenyan = () => {
    if (platform === 'tiktok') {
      setPlatform('all');
    }
    setTimeout(() => {
      kenyanSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const resetFilters = () => {
    setPlatform('all');
    setSearch('');
    setSort('viewers');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0614] text-[#FFF5FA]">
      <Navbar
        activePlatform={platform}
        onSelectPlatform={setPlatform}
        counts={platformCounts}
      />

      <HeroHeader
        totalLiveCount={data?.totalLiveCount ?? 0}
        updatedAt={data?.updatedAt ?? null}
        nowMs={nowMs}
        isDemoData={data?.isDemoData ?? false}
        isLoading={isLoading}
        onJumpKenyan={handleJumpKenyan}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-10">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          visibleCount={visibleCount}
          isTikTokTab={isTikTokTab}
        />

        {isLoading ? (
          <SkeletonGrid count={8} />
        ) : fetchError && !data ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#FF3B3B]/35 bg-[#170B2A] p-8 text-center"
          >
            <h2 className="font-display text-xl font-bold text-[#FFF5FA]">
              Couldn&apos;t load live streams right now
            </h2>
            <p className="mt-2 text-sm text-[#B7A9CC]">
              Please check your connection and try refreshing.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                fetchLive(false);
              }}
              className="mt-5 min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7] px-5 py-2.5 text-sm font-semibold text-[#FFF5FA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Try again</span>
            </button>
          </div>
        ) : isTikTokTab ? (
          /* Dedicated TikTok Creators View (no live status claims) */
          <section aria-labelledby="tiktok-heading" className="space-y-4">
            <div>
              <h2
                id="tiktok-heading"
                className="font-display text-xl font-bold text-[#FFF5FA] sm:text-2xl"
              >
                TikTok Creators
              </h2>
              <p className="mt-1 text-sm text-[#B7A9CC]">
                TikTok does not provide a public live status API — tap any creator below to check
                their TikTok profile directly.
              </p>
            </div>

            {filteredTiktok.length === 0 ? (
              <div className="rounded-2xl border border-[#B7A9CC]/15 bg-[#170B2A] p-8 text-center">
                <p className="text-base font-semibold text-[#FFF5FA]">
                  No TikTok creators matched &ldquo;{search}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 min-h-[44px] rounded-xl bg-[#251242] px-4 py-2 text-sm font-semibold text-[#FFF5FA] hover:bg-[#321959] cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTiktok.map((creator) => (
                  <TikTokCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}
          </section>
        ) : filteredLive.length === 0 ? (
          /* Friendly Empty State when filter or search matches 0 live streamers */
          <div className="rounded-2xl border border-[#B7A9CC]/15 bg-[#170B2A] px-6 py-12 text-center">
            <Tv className="mx-auto h-9 w-9 text-[#FF8A3D]" aria-hidden="true" />
            <h2 className="mt-3 font-display text-xl font-bold text-[#FFF5FA]">
              No one is live in this view right now
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-[#B7A9CC]">
              {search.trim()
                ? `No live streamers matched "${search}" on this platform filter.`
                : 'Try switching back to All platforms or check the offline channels below.'}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7] px-5 py-2.5 text-sm font-semibold text-[#FFF5FA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C7]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Show all live streamers</span>
            </button>
          </div>
        ) : (
          <>
            {/* 1. Featured Row */}
            {filteredFeatured.length > 0 && (
              <section aria-labelledby="featured-heading" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-[#FF8A3D]" aria-hidden="true" />
                  <h2
                    id="featured-heading"
                    className="font-display text-xl font-bold tracking-tight text-[#FFF5FA] sm:text-2xl"
                  >
                    Featured Live
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredFeatured.map((streamer) => (
                    <StreamerCard
                      key={`featured-${streamer.id}`}
                      streamer={streamer}
                      priorityBadge="Featured"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Dedicated Kenyan Streamers Section */}
            {filteredKenyan.length > 0 && (
              <section
                ref={kenyanSectionRef}
                id="kenyan-streamers"
                aria-labelledby="kenyan-heading"
                className="space-y-4 rounded-2xl border border-[#00E5C7]/25 bg-[#120A22] p-4 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#00E5C7]/35 bg-[#00E5C7]/12 px-2.5 py-1 text-xs font-bold text-[#00E5C7]"
                      aria-hidden="true"
                    >
                      🇰🇪 KE
                    </span>
                    <h2
                      id="kenyan-heading"
                      className="font-display text-xl font-bold tracking-tight text-[#FFF5FA] sm:text-2xl"
                    >
                      Kenyan Streamers
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-[#00E5C7] tabular-nums">
                    {filteredKenyan.length} live from Kenya
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredKenyan.map((streamer) => (
                    <StreamerCard key={`ke-${streamer.id}`} streamer={streamer} />
                  ))}
                </div>
              </section>
            )}

            {/* 3. All Live Streamers Directory Grid */}
            <section aria-labelledby="all-live-heading" className="space-y-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2
                  id="all-live-heading"
                  className="font-display text-xl font-bold tracking-tight text-[#FFF5FA] sm:text-2xl"
                >
                  All Live Streamers
                </h2>
                <span className="text-xs text-[#B7A9CC] tabular-nums">
                  {filteredLive.length} {filteredLive.length === 1 ? 'stream' : 'streams'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredLive.map((streamer) => (
                  <StreamerCard key={`all-${streamer.id}`} streamer={streamer} />
                ))}
              </div>
            </section>

            {/* 4. Curated TikTok Creators strip when viewing All */}
            {platform === 'all' && filteredTiktok.length > 0 && (
              <section aria-labelledby="tiktok-all-heading" className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id="tiktok-all-heading"
                    className="font-display text-xl font-bold tracking-tight text-[#FFF5FA] sm:text-2xl"
                  >
                    Creators on TikTok
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPlatform('tiktok')}
                    className="min-h-[36px] text-xs font-semibold text-[#FF2E93] hover:text-[#FF8A3D] transition-colors cursor-pointer"
                  >
                    View all TikTok creators
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTiktok.slice(0, 4).map((creator) => (
                    <TikTokCard key={`all-tt-${creator.id}`} creator={creator} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 5. Offline Curated Streamers */}
        {!isLoading && !isTikTokTab && <OfflineRow streamers={filteredOffline} />}
      </main>

      <footer className="border-t border-[#B7A9CC]/15 bg-[#0B0614] py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#B7A9CC]/85">
          <p className="font-medium text-[#B7A9CC]">{APP_CONFIG.APP_NAME}</p>
          <p>{APP_CONFIG.FOOTER_DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  );
}
