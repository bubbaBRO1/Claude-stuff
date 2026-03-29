import { NextResponse } from 'next/server';
import { getOrCreateSession } from '../../lib/session';

export async function POST() {
  try {
    const sessionId = await getOrCreateSession();
    return NextResponse.json({ sessionId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
