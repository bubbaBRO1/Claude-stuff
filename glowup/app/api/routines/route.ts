import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';
import { calcStreak, toDateKey } from '../../lib/streak';

const DEFAULT_STEPS = [
  { order: 0, title: 'Wake Up & Drink Water', icon: '💧', durationSec: 0 },
  { order: 1, title: 'Wash Face', icon: '🧼', durationSec: 60 },
  { order: 2, title: 'Moisturize + SPF', icon: '🧴', durationSec: 60 },
  { order: 3, title: 'Brush Teeth', icon: '🦷', durationSec: 120 },
  { order: 4, title: 'Style Hair', icon: '💇', durationSec: 120 },
  { order: 5, title: 'Get Dressed', icon: '👔', durationSec: 0 },
  { order: 6, title: 'Daily Affirmation', icon: '⭐', durationSec: 30 },
];

async function ensureDefaultRoutine(sessionId: string) {
  const existing = await prisma.routine.findFirst({ where: { sessionId } });
  if (existing) return existing;

  return prisma.routine.create({
    data: {
      sessionId,
      name: 'Morning Routine',
      steps: { create: DEFAULT_STEPS },
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
}

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const routine = await ensureDefaultRoutine(sessionId);

    const fullRoutine = await prisma.routine.findUnique({
      where: { id: routine.id },
      include: { steps: { orderBy: { order: 'asc' } }, logs: { orderBy: { dateKey: 'desc' }, take: 100 } },
    });

    const dateKeys = fullRoutine!.logs.map((l) => l.dateKey);
    const streak = calcStreak(dateKeys);
    const completedToday = dateKeys.includes(toDateKey());

    return NextResponse.json({ ...fullRoutine, streak, completedToday });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const { name, steps } = await req.json();

    const routine = await prisma.routine.findFirst({ where: { sessionId } });
    if (!routine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.routineStep.deleteMany({ where: { routineId: routine.id } });
    await prisma.routine.update({
      where: { id: routine.id },
      data: {
        name,
        steps: {
          create: steps.map((s: { title: string; icon: string; durationSec: number }, i: number) => ({
            order: i,
            title: s.title,
            icon: s.icon,
            durationSec: s.durationSec,
          })),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
