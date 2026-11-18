import { getLiveDirectory, LIVE_RESPONSE_HEADERS } from '../../lib/live-aggregator';

interface NetlifyEvent {
  httpMethod?: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Netlify Serverless Function: /.netlify/functions/live (mapped to /api/live via netlify.toml)
 * Aggregates live streams from Twitch, YouTube, Kick, and curated TikTok creators.
 */
export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = await getLiveDirectory();
    return {
      statusCode: 200,
      headers: {
        ...LIVE_RESPONSE_HEADERS,
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(payload),
    };
  } catch (error) {
    console.error('[Netlify Function /live] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to aggregate live streams' }),
    };
  }
}
