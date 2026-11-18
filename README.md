# Zeutube fm

A fast, mobile-first live directory of streamers and celebrities playing Grand Theft Auto VI across **YouTube**, **Twitch**, **Kick**, and **TikTok** — built with Next.js App Router and Netlify Functions.

## Quick Customization

- **Rename the app**: Change `APP_NAME` in `lib/config.ts` (one constant updates the navbar, title, OpenGraph tags, and footer).
- **Edit curated streamers**: Update `streamers.json` at the repository root.
  - Set `featured: true` to promote a creator in the **Featured Live** row.
  - Set `country: "KE"` to surface a creator in the **Kenyan Streamers** section with the Kenyan flag badge.
  - Replace any `TODO_*` placeholder handles (`youtubeChannelId`, `twitchLogin`, `kickSlug`, `tiktokUsername`) with real creator handles. Handles left as `TODO_*` are automatically skipped.

## Demo Mode vs Live APIs

If no platform API keys are configured, the `/api/live` endpoint automatically serves realistic **Demo Mode** data and displays a small **Demo data** tag near the live counter.

Add the following environment variables (locally in `.env.local`, or in your Netlify site settings) to switch to real live stream data:

- `YOUTUBE_API_KEY` — YouTube Data API v3 key (curated channels use quota-safe `channels` + `playlistItems` + batched `videos`; category discovery `search.list` runs at most once every 10 minutes and is cached in memory).
- `TWITCH_CLIENT_ID` & `TWITCH_CLIENT_SECRET` — Twitch Helix API Client Credentials.
- `KICK_CLIENT_ID` & `KICK_CLIENT_SECRET` — Optional Kick Public API Client Credentials (fails gracefully if unavailable).

All third-party API requests happen strictly on the server inside `lib/live-aggregator.ts`, invoked by `app/api/live/route.ts` (Next.js) and `netlify/functions/live.ts` (Netlify Functions).

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run unit tests:

```bash
npx --yes tsx --test lib/stream-utils.test.ts lib/live-aggregator.test.ts
```

## Deploying to Netlify

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Netlify, create a new site from Git:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: `netlify/functions` (already configured in `netlify.toml`)
3. Add your API keys in **Site configuration -> Environment variables** (`YOUTUBE_API_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, and optionally `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`).
4. Deploy. `netlify.toml` automatically routes `/api/live` to `/.netlify/functions/live`, with `Netlify-CDN-Cache-Control` caching responses for 60 seconds at the edge so traffic spikes trigger minimal upstream API calls.
