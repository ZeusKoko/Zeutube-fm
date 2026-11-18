<div align="center">

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWk2eHNsOXUzcnJmbWpnYjNyZXd5ZzRtZDhrYnZ3dGRqamxrazhieCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ADZHmZIWCxMo9Rajar/giphy.gif" alt="Zeutube fm — Vice Coast GTA VI Vibe" width="760" />

<br />

# 🌴 ZEUTUBE FM

**Vice Coast Live Streamer Directory for Grand Theft Auto VI**

*See who is live across YouTube, Twitch, Kick, and TikTok right now — zero login, instant platform switching, built for fast mobile data.*

<br />

<!-- Streaming Platforms & Live Capabilities -->
<p>
  <a href="#platform--api-architecture"><img src="https://img.shields.io/badge/LIVE-DIRECTORY-FF3B3B?style=for-the-badge&logo=livejournal&logoColor=FFF5FA&labelColor=170B2A" alt="Live Directory" /></a>
  <a href="#platform--api-architecture"><img src="https://img.shields.io/badge/YouTube-Live_Streams-FF2E93?style=for-the-badge&logo=youtube&logoColor=FF3B3B&labelColor=170B2A" alt="YouTube" /></a>
  <a href="#platform--api-architecture"><img src="https://img.shields.io/badge/Twitch-Helix_API-7B2FF7?style=for-the-badge&logo=twitch&logoColor=D4B8FF&labelColor=170B2A" alt="Twitch" /></a>
  <a href="#platform--api-architecture"><img src="https://img.shields.io/badge/Kick-Public_API-00E5C7?style=for-the-badge&logo=kick&logoColor=00E5C7&labelColor=170B2A" alt="Kick" /></a>
  <a href="#platform--api-architecture"><img src="https://img.shields.io/badge/TikTok-Creators-FF8A3D?style=for-the-badge&logo=tiktok&logoColor=FF2E93&labelColor=170B2A" alt="TikTok" /></a>
</p>

<!-- Tech Stack, Edge Cache & Spotlight -->
<p>
  <img src="https://img.shields.io/badge/Next.js-15-FF2E93?style=flat-square&logo=nextdotjs&logoColor=FFF5FA&labelColor=170B2A" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-FF8A3D?style=flat-square&logo=typescript&logoColor=FF8A3D&labelColor=170B2A" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-00E5C7?style=flat-square&logo=tailwindcss&logoColor=00E5C7&labelColor=170B2A" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Netlify-Functions-FFD23F?style=flat-square&logo=netlify&logoColor=FFD23F&labelColor=170B2A" alt="Netlify Functions" />
  <img src="https://img.shields.io/badge/Edge_Cache-60s_TTL-7B2FF7?style=flat-square&logo=cloudflare&logoColor=D4B8FF&labelColor=170B2A" alt="60s Edge Cache" />
  <img src="https://img.shields.io/badge/🇰🇪_Kenya-Spotlight-00E5C7?style=flat-square&labelColor=170B2A" alt="Kenyan Streamers Spotlight" />
</p>

<p>
  <a href="#key-features"><strong>Features</strong></a> ·
  <a href="#platform--api-architecture"><strong>Architecture</strong></a> ·
  <a href="#vice-sunset-palette"><strong>Palette</strong></a> ·
  <a href="#quick-customization"><strong>Customize</strong></a> ·
  <a href="#local-development"><strong>Local Setup</strong></a> ·
  <a href="#deploying-to-netlify"><strong>Deploy to Netlify</strong></a>
</p>

</div>

---

## Welcome to Leonida

**Zeutube fm** is a fast, mobile-first live broadcast directory built to answer one question in under a second: **who is playing Grand Theft Auto VI live right now, and where can I watch them?**

No sign-in walls. No bloated player embeds. Open the page, scan the Vice sunset grid, and tap straight into the creator's broadcast on **YouTube**, **Twitch**, **Kick**, or **TikTok**.

---

## Key Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>⚡ Instant Platform Filtering</h3>
      <p>Switch seamlessly between <code>All</code>, <code>YouTube</code>, <code>Twitch</code>, <code>Kick</code>, and <code>TikTok</code> with zero page reloads or redundant fetches — the latest response stays cached in memory.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🎛️ Unified Multi-Platform Cards</h3>
      <p>Simulcasting creators like <strong>Kai Cenat</strong> or <strong>IShowSpeed</strong> appear on <strong>one clean card</strong> with a dedicated watch button for each active live platform.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🔥 Featured & 🇰🇪 Kenyan Spotlights</h3>
      <p>Promotes flagship creators in the <strong>Featured Live</strong> row at the top, plus a dedicated <strong>Kenyan Streamers</strong> section highlighted with a <code>🇰🇪 KE</code> badge.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📱 Built for 360px & Fast Data</h3>
      <p>Immediate skeleton cards, lazy-loaded 16:9 thumbnails with fixed aspect dimensions, zero heavy UI libraries, and quiet 60-second background refreshes.</p>
    </td>
  </tr>
</table>

- **Live Search & Smart Sorting** — Filter by streamer name in real time and sort by **Most viewers** (default) or **Newest live**.
- **Offline Curated Roster** — Muted `"Not live right now"` section at the bottom with direct channel links.
- **Automatic Demo Mode** — Runs out of the box with realistic demo broadcasts and a subtle `Demo data` indicator whenever API keys are omitted.

---

## Platform & API Architecture

All third-party API calls execute strictly on the server inside [`lib/live-aggregator.ts`](lib/live-aggregator.ts), exposed through both [`app/api/live/route.ts`](app/api/live/route.ts) (Next.js) and [`netlify/functions/live.ts`](netlify/functions/live.ts) (Netlify Functions).

```mermaid
flowchart LR
    Visitor["📱 Visitor Browser\n(60s Silent Refresh + Memory Cache)"] --> CDN["⚡ Netlify Edge CDN\n(s-maxage=60)"]
    CDN --> Aggregator["🧠 /api/live Aggregator\n(lib/live-aggregator.ts)"]
    Aggregator --> Twitch["Twitch Helix API\n(Category + Curated Logins)"]
    Aggregator --> YouTube["YouTube Data API v3\n(Uploads Playlist + 10m Search Cache)"]
    Aggregator --> Kick["Kick Public API\n(Graceful Fallback Links)"]
    Aggregator --> TikTok["Curated TikTok Roster\n(Profile Pass-Through)"]
    Aggregator -. "No API Keys Configured" .-> Demo["🌴 Demo Mode Payload"]
```

| Platform | Integration Strategy | Caching & Resilience |
| :--- | :--- | :--- |
| **Twitch** | Official Helix API (`client_credentials`), GTA VI category lookup + batched curated login checks | `60s` edge CDN cache (`s-maxage=60`) |
| **YouTube** | Quota-safe curated checks (`channels` → `playlistItems` → single batched `videos.list`) | Category `search.list` throttled to **once per 10 mins** in memory |
| **Kick** | Official public API client credentials with short timeout | Fails gracefully to curated channel links if unavailable |
| **TikTok** | Curated creator pass-through (`Check on TikTok` buttons) | No unverified live claims (no public live API) |
| **Demo Mode** | Activates automatically when API keys are omitted | Displays realistic live/offline preview + subtle `Demo data` tag |

---

## Vice Sunset Palette

Designed around a dark tropical neon dusk mood — high contrast, crisp tabular numerals, and `prefers-reduced-motion` support:

| Swatch | Token | Hex | Usage |
| :---: | :--- | :--- | :--- |
| ![#0B0614](https://img.shields.io/badge/%20-0B0614-0B0614?style=flat-square) | **Midnight Base** | `#0B0614` | Primary canvas background |
| ![#170B2A](https://img.shields.io/badge/%20-170B2A-170B2A?style=flat-square) | **Velvet Card** | `#170B2A` | Streamer card & toolbar surfaces |
| ![#FF2E93](https://img.shields.io/badge/%20-FF2E93-FF2E93?style=flat-square) | **Neon Pink** | `#FF2E93` | Gradient start, active focus & TikTok accents |
| ![#FF8A3D](https://img.shields.io/badge/%20-FF8A3D-FF8A3D?style=flat-square) | **Sunset Orange** | `#FF8A3D` | Gradient mid-stop & featured accents |
| ![#FFD23F](https://img.shields.io/badge/%20-FFD23F-FFD23F?style=flat-square) | **Golden Yellow** | `#FFD23F` | Headline highlights & demo mode indicator |
| ![#7B2FF7](https://img.shields.io/badge/%20-7B2FF7-7B2FF7?style=flat-square) | **Electric Purple** | `#7B2FF7` | Gradient end & Twitch accents |
| ![#00E5C7](https://img.shields.io/badge/%20-00E5C7-00E5C7?style=flat-square) | **Tropical Teal** | `#00E5C7` | Kenyan Streamers spotlight & Kick accents |
| ![#FF3B3B](https://img.shields.io/badge/%20-FF3B3B-FF3B3B?style=flat-square) | **Live Crimson** | `#FF3B3B` | Pulsing `LIVE` status badge |

---

## Quick Customization

### 1. Rename the App
All branding (`navbar`, `<title>`, OpenGraph tags, and footer) reads from a single constant in [`lib/config.ts`](lib/config.ts):

```ts
export const APP_CONFIG = {
  APP_NAME: 'Zeutube fm',
  // ...
};
```

### 2. Edit Curated Streamers
Update [`streamers.json`](streamers.json) at the project root:

```json
{
  "id": "kai-cenat",
  "displayName": "Kai Cenat",
  "avatarUrl": "",
  "featured": true,
  "country": "US",
  "youtubeChannelId": "TODO_YOUTUBE_CHANNEL_ID",
  "twitchLogin": "kaicenat",
  "kickSlug": "TODO_KICK_SLUG",
  "tiktokUsername": "kaicenat"
}
```

- Set `"featured": true` to pin the creator to the **Featured Live** row.
- Set `"country": "KE"` to highlight the creator in the **Kenyan Streamers** section with a `🇰🇪 KE` badge.
- Leave unknown handles prefixed with `TODO_` — they are ignored safely until filled in.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure optional API keys (omit to run in Demo Mode)
cp .env.example .env.local

# 3. Start the development server
npm run dev
```

### Run Tests & Checks

```bash
# Pure logic & aggregator unit tests (node:test)
npx --yes tsx --test lib/stream-utils.test.ts lib/live-aggregator.test.ts

# TypeScript build & ESLint
npm run build
npm run lint
```

---

## Deploying to Netlify

`netlify.toml` is preconfigured for Next.js + Netlify Functions (`netlify/functions/live.ts`) with edge CDN caching:

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Create a new site in **Netlify** from your repository:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: `netlify/functions`
3. Add your environment variables under **Site configuration → Environment variables**:
   - `YOUTUBE_API_KEY`
   - `TWITCH_CLIENT_ID`
   - `TWITCH_CLIENT_SECRET`
   - `KICK_CLIENT_ID` *(optional)*
   - `KICK_CLIENT_SECRET` *(optional)*
4. Deploy. Requests to `/api/live` automatically route to `/.netlify/functions/live` and cache at Netlify's edge CDN for 60 seconds (`Netlify-CDN-Cache-Control: public, s-maxage=60, stale-while-revalidate=120`).

---

## Project Structure

```text
├── app/
│   ├── api/live/route.ts       # Next.js server endpoint for live streams
│   ├── globals.css             # Vice sunset palette & reduced-motion rules
│   ├── layout.tsx              # Outfit + Plus Jakarta Sans font setup
│   └── page.tsx                # Main directory entry point
├── components/
│   ├── DirectoryClient.tsx     # In-memory cache, 60s polling, sections & filters
│   ├── HeroHeader.tsx          # Sunset backdrop, live counter & status strip
│   ├── Navbar.tsx              # Sticky platform filter tabs
│   ├── StreamerCard.tsx        # Unified live card (1 or multiple watch buttons)
│   ├── TikTokCard.tsx          # Curated TikTok profile cards
│   ├── OfflineRow.tsx          # Muted offline curated roster
│   └── SkeletonGrid.tsx        # Instant loading placeholders
├── lib/
│   ├── config.ts               # Central APP_NAME & cache constants
│   ├── live-aggregator.ts      # Twitch, YouTube, Kick, TikTok & Demo Mode engine
│   ├── stream-utils.ts         # Merging, filtering, sorting & formatting helpers
│   └── *.test.ts               # Node test runner unit tests
├── netlify/functions/live.ts   # Netlify serverless function wrapper
├── public/images/              # Local optimized sunset & stream preview assets
├── streamers.json              # Curated creator & Kenyan streamer seed list
├── netlify.toml                # Netlify build, function & redirect config
└── .env.example                # Server-side API key template
```

---

<div align="center">

<sub>Not affiliated with Rockstar Games or Take-Two Interactive. Stream links go to the streamers' own platforms.</sub>

</div>
