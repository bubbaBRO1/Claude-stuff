import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { getOrCreateSession } from '../../../lib/session';
import { toDateKey } from '../../../lib/streak';

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const logs = await prisma.waterLog.findMany({
      where: { sessionId },
      orderBy: { dateKey: 'desc' },
      take: 14,
    });
    const today = toDateKey();
    const todayLog = logs.find(l => l.dateKey === today) ?? { glasses: 0 };
    return NextResponse.json({ logs, todayLog });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const today = toDateKey();
    const { glasses } = await req.json();
    const log = await prisma.waterLog.upsert({
      where: { sessionId_dateKey: { sessionId, dateKey: today } },
      update: { glasses },
      create: { sessionId, dateKey: today, glasses },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
