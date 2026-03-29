import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { getOrCreateSession } from '../../../../lib/session';
import { toDateKey } from '../../../../lib/streak';

export async function POST() {
  try {
    const sessionId = await getOrCreateSession();
    const today = toDateKey();
    const existing = await prisma.waterLog.findUnique({
      where: { sessionId_dateKey: { sessionId, dateKey: today } },
    });
    const newGlasses = (existing?.glasses ?? 0) + 1;
    const log = await prisma.waterLog.upsert({
      where: { sessionId_dateKey: { sessionId, dateKey: today } },
      update: { glasses: newGlasses },
      create: { sessionId, dateKey: today, glasses: 1 },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
