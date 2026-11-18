/**
 * Central application configuration.
 * Change APP_NAME here to rebrand the entire site in one place.
 */
export const APP_CONFIG = {
  APP_NAME: 'Leonida Live',
  APP_SHORT_DESCRIPTION:
    'Live directory of streamers and celebrities playing Grand Theft Auto VI right now across YouTube, Twitch, Kick, and TikTok.',
  TARGET_GAME_TITLE: 'Grand Theft Auto VI',
  REFRESH_INTERVAL_MS: 60_000,
  TWITCH_KICK_CACHE_SECONDS: 60,
  YOUTUBE_DISCOVERY_CACHE_SECONDS: 600,
  FOOTER_DISCLAIMER:
    'Not affiliated with Rockstar Games or Take Two Interactive. Stream links go to the streamers\u2019 own platforms.',
} as const;
