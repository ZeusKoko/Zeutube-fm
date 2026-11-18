import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoLiveResponse, getLiveDirectory, LIVE_RESPONSE_HEADERS } from './live-aggregator';

test('buildDemoLiveResponse populates live, featured, Kenyan, multi-platform, offline, and TikTok sections', () => {
  const demo = buildDemoLiveResponse('2026-11-18T12:00:00.000Z');
  assert.equal(demo.isDemoData, true);
  assert.ok(demo.liveStreamers.length >= 10);
  assert.equal(demo.totalLiveCount, demo.liveStreamers.length);

  // Kai Cenat and IShowSpeed should each appear once with 2 platforms
  const kai = demo.liveStreamers.find((s) => s.id === 'kai-cenat');
  assert.ok(kai);
  assert.equal(kai.platforms.length, 2);
  assert.equal(kai.featured, true);

  const kenyanLive = demo.liveStreamers.filter((s) => s.country === 'KE');
  assert.ok(kenyanLive.length >= 2);

  // Offline curated should include The Cowboys and Mombasa Drift
  assert.ok(demo.offlineCurated.some((s) => s.id === 'the-cowboys'));
  assert.ok(demo.offlineCurated.some((s) => s.id === 'mombasa-drift'));

  // TikTok creators should have checkOnly: true and no live claims
  assert.ok(demo.tiktokCreators.length > 0);
  assert.equal(demo.tiktokCreators[0].isLive, false);
  assert.equal(demo.tiktokCreators[0].platforms[0].checkOnly, true);
});

test('getLiveDirectory falls back to Demo Mode when no API keys are configured', async () => {
  const prevTw = process.env.TWITCH_CLIENT_ID;
  const prevYt = process.env.YOUTUBE_API_KEY;
  const prevKk = process.env.KICK_CLIENT_ID;
  delete process.env.TWITCH_CLIENT_ID;
  delete process.env.YOUTUBE_API_KEY;
  delete process.env.KICK_CLIENT_ID;

  try {
    const res = await getLiveDirectory();
    assert.equal(res.isDemoData, true);
    assert.ok(res.liveStreamers.length > 0);
  } finally {
    if (prevTw !== undefined) process.env.TWITCH_CLIENT_ID = prevTw;
    if (prevYt !== undefined) process.env.YOUTUBE_API_KEY = prevYt;
    if (prevKk !== undefined) process.env.KICK_CLIENT_ID = prevKk;
  }
});

test('LIVE_RESPONSE_HEADERS includes CDN cache directives for Netlify and browsers', () => {
  assert.match(LIVE_RESPONSE_HEADERS['Cache-Control'], /s-maxage=60/);
  assert.match(LIVE_RESPONSE_HEADERS['Netlify-CDN-Cache-Control'], /s-maxage=60/);
});
