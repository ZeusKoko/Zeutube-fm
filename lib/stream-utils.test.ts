import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOfflineCurated,
  buildPlatformUrl,
  buildTiktokCreators,
  filterAndSortStreamers,
  formatRelativeUpdated,
  formatViewerCount,
  isTodoValue,
  mergeLiveStreams,
} from './stream-utils';
import type { CuratedStreamer } from './types';

const SAMPLE_CURATED: CuratedStreamer[] = [
  {
    id: 'kai-cenat',
    displayName: 'Kai Cenat',
    avatarUrl: '',
    featured: true,
    country: 'US',
    youtubeChannelId: 'UC_KAI',
    twitchLogin: 'kaicenat',
    kickSlug: 'TODO_KICK_SLUG',
    tiktokUsername: 'kaicenat',
  },
  {
    id: 'chebet-plays',
    displayName: 'Chebet Plays',
    avatarUrl: '',
    featured: false,
    country: 'KE',
    youtubeChannelId: 'TODO_YOUTUBE_CHANNEL_ID',
    twitchLogin: 'chebetplays',
    kickSlug: 'TODO_KICK_SLUG',
    tiktokUsername: 'chebetplays',
  },
  {
    id: 'the-cowboys',
    displayName: 'The Cowboys',
    avatarUrl: '',
    featured: true,
    country: 'US',
    youtubeChannelId: 'TODO_YOUTUBE_CHANNEL_ID',
    twitchLogin: 'cowboyslive',
    kickSlug: 'TODO_KICK_SLUG',
    tiktokUsername: 'TODO_TIKTOK_USERNAME',
  },
];

test('isTodoValue detects empty and TODO handles', () => {
  assert.equal(isTodoValue(''), true);
  assert.equal(isTodoValue(undefined), true);
  assert.equal(isTodoValue('TODO_KICK_SLUG'), true);
  assert.equal(isTodoValue('todo_test'), true);
  assert.equal(isTodoValue('kaicenat'), false);
});

test('mergeLiveStreams combines multi-platform streams for one curated creator into one card', () => {
  const merged = mergeLiveStreams(SAMPLE_CURATED, [
    {
      platform: 'twitch',
      channelHandle: 'kaicenat',
      displayName: 'KaiCenat',
      title: 'Vice Coast Marathon Day 1',
      viewerCount: 95000,
      startedAt: '2026-11-18T10:00:00.000Z',
      url: buildPlatformUrl('twitch', 'kaicenat'),
    },
    {
      platform: 'youtube',
      channelHandle: 'UC_KAI',
      displayName: 'Kai Cenat Live',
      title: 'Vice Coast Marathon YT Mirror',
      viewerCount: 35000,
      startedAt: '2026-11-18T10:30:00.000Z',
      url: buildPlatformUrl('youtube', 'UC_KAI', 'vid123'),
    },
    {
      platform: 'twitch',
      channelHandle: 'chebetplays',
      displayName: 'Chebet Plays',
      title: 'Nairobi to Leonida late night cruise',
      viewerCount: 4200,
      startedAt: '2026-11-18T11:00:00.000Z',
      url: buildPlatformUrl('twitch', 'chebetplays'),
    },
  ]);

  assert.equal(merged.length, 2);
  const kai = merged.find((s) => s.id === 'kai-cenat');
  assert.ok(kai);
  assert.equal(kai.platforms.length, 2);
  assert.equal(kai.totalViewers, 130000);
  assert.equal(kai.latestStartedAt, '2026-11-18T10:30:00.000Z');
  assert.equal(kai.primaryTitle, 'Vice Coast Marathon Day 1');
});

test('filterAndSortStreamers supports instant platform filter, search, and viewer/newest sorting', () => {
  const merged = mergeLiveStreams(SAMPLE_CURATED, [
    {
      platform: 'twitch',
      channelHandle: 'kaicenat',
      displayName: 'Kai Cenat',
      title: 'First live',
      viewerCount: 95000,
      startedAt: '2026-11-18T09:00:00.000Z',
      url: 'https://twitch.tv/kaicenat',
    },
    {
      platform: 'twitch',
      channelHandle: 'chebetplays',
      displayName: 'Chebet Plays',
      title: 'Newest stream',
      viewerCount: 4200,
      startedAt: '2026-11-18T11:00:00.000Z',
      url: 'https://twitch.tv/chebetplays',
    },
    {
      platform: 'kick',
      channelHandle: 'adinross',
      displayName: 'Adin Ross',
      title: 'Kick exclusive',
      viewerCount: 54000,
      startedAt: '2026-11-18T10:00:00.000Z',
      url: 'https://kick.com/adinross',
    },
  ]);

  const byViewers = filterAndSortStreamers(merged, {
    platform: 'all',
    search: '',
    sort: 'viewers',
  });
  assert.deepEqual(
    byViewers.map((s) => s.displayName),
    ['Kai Cenat', 'Adin Ross', 'Chebet Plays']
  );

  const byNewest = filterAndSortStreamers(merged, {
    platform: 'all',
    search: '',
    sort: 'newest',
  });
  assert.deepEqual(
    byNewest.map((s) => s.displayName),
    ['Chebet Plays', 'Adin Ross', 'Kai Cenat']
  );

  const kickOnly = filterAndSortStreamers(merged, {
    platform: 'kick',
    search: '',
    sort: 'viewers',
  });
  assert.deepEqual(
    kickOnly.map((s) => s.displayName),
    ['Adin Ross']
  );

  const searchChebet = filterAndSortStreamers(merged, {
    platform: 'all',
    search: 'chebet',
    sort: 'viewers',
  });
  assert.equal(searchChebet.length, 1);
  assert.equal(searchChebet[0].country, 'KE');
});

test('buildOfflineCurated and buildTiktokCreators exclude live creators and TODO handles', () => {
  const live = mergeLiveStreams(SAMPLE_CURATED, [
    {
      platform: 'twitch',
      channelHandle: 'kaicenat',
      displayName: 'Kai Cenat',
      title: 'Live now',
      viewerCount: 50000,
      startedAt: '2026-11-18T10:00:00.000Z',
      url: 'https://twitch.tv/kaicenat',
    },
  ]);

  const offline = buildOfflineCurated(SAMPLE_CURATED, live);
  assert.deepEqual(
    offline.map((s) => s.id),
    ['chebet-plays', 'the-cowboys']
  );

  const tiktok = buildTiktokCreators(SAMPLE_CURATED);
  assert.equal(tiktok.length, 2);
  assert.equal(tiktok[0].platforms[0].checkOnly, true);
  assert.equal(tiktok[0].isLive, false);
});

test('formatViewerCount and formatRelativeUpdated render clean readable labels', () => {
  assert.equal(formatViewerCount(850), '850');
  assert.equal(formatViewerCount(14200), '14.2K');
  assert.equal(formatViewerCount(1_200_000), '1.2M');

  const now = Date.parse('2026-11-18T12:00:00.000Z');
  assert.equal(formatRelativeUpdated('2026-11-18T11:59:45.000Z', now), 'Updated just now');
  assert.equal(formatRelativeUpdated('2026-11-18T11:58:00.000Z', now), 'Updated 2 mins ago');
});
