import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { getOrCreateSession } from '../../../lib/session';
import { calcStreak, toDateKey } from '../../../lib/streak';

export async function POST() {
  try {
    const sessionId = await getOrCreateSession();
    const routine = await prisma.routine.findFirst({ where: { sessionId } });
    if (!routine) return NextResponse.json({ error: 'No routine' }, { status: 404 });

    const dateKey = toDateKey();

    await prisma.routineLog.upsert({
      where: { routineId_dateKey: { routineId: routine.id, dateKey } },
      create: { routineId: routine.id, dateKey },
      update: {},
    });

    const logs = await prisma.routineLog.findMany({
      where: { routineId: routine.id },
      orderBy: { dateKey: 'desc' },
      take: 100,
    });
    const streak = calcStreak(logs.map((l) => l.dateKey));
    const prevStreak = calcStreak(logs.slice(1).map((l) => l.dateKey));

    return NextResponse.json({ streak, isNewRecord: streak > prevStreak });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
