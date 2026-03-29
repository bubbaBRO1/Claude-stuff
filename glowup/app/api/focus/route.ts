import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';
import { toDateKey } from '../../lib/streak';

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const today = toDateKey();
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');
    const sessions = await prisma.focusSession.findMany({
      where: {
        sessionId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { createdAt: 'desc' },
    });
    const totalMins = sessions
      .filter(s => s.completedAt)
      .reduce((sum, s) => sum + s.durationMin, 0);
    return NextResponse.json({ sessions, totalMins });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const { durationMin, type, completedAt } = await req.json();
    const session = await prisma.focusSession.create({
      data: {
        sessionId,
        durationMin,
        type: type ?? 'work',
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });
    return NextResponse.json(session);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
