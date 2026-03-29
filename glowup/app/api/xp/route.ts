import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';
import { calcLevel } from '../../lib/xp';
import { toDateKey } from '../../lib/streak';

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const logs = await prisma.xPLog.findMany({ where: { sessionId }, orderBy: { createdAt: 'desc' } });
    const totalXP = logs.reduce((s, l) => s + l.amount, 0);
    const { level, currentXP, xpNeeded, progress } = calcLevel(totalXP);
    const today = toDateKey();
    const todayLogs = logs.filter(l => l.createdAt.toISOString().split('T')[0] === today);
    const todayXP = todayLogs.reduce((s, l) => s + l.amount, 0);
    return NextResponse.json({ totalXP, level, currentXP, xpNeeded, progress, todayXP, todayLogs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const { amount, reason } = await req.json();
    const log = await prisma.xPLog.create({ data: { sessionId, amount, reason } });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
