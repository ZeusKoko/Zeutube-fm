import { NextResponse } from 'next/server';
import { getLiveDirectory, LIVE_RESPONSE_HEADERS } from '@/lib/live-aggregator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getLiveDirectory();
    return NextResponse.json(payload, {
      status: 200,
      headers: LIVE_RESPONSE_HEADERS,
    });
  } catch (err) {
    console.error('[Leonida Live] /api/live error:', err);
    return NextResponse.json(
      { error: 'Unable to load live directory right now.' },
      { status: 500 }
    );
  }
}
