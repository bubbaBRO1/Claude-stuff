import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { getOrCreateSession } from '../../../lib/session';
import { toDateKey } from '../../../lib/streak';

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const logs = await prisma.sleepLog.findMany({
      where: { sessionId },
      orderBy: { dateKey: 'desc' },
      take: 14,
    });
    const today = toDateKey();
    const todayLog = logs.find(l => l.dateKey === today) ?? null;
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
    const { hours, quality } = await req.json();
    const log = await prisma.sleepLog.upsert({
      where: { sessionId_dateKey: { sessionId, dateKey: today } },
      update: { hours, quality },
      create: { sessionId, dateKey: today, hours, quality },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
