import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';
import { toDateKey } from '../../lib/streak';

const DEFAULT_HABITS = [
  { name: 'Morning Skincare', icon: '🧴', category: 'skincare' },
  { name: 'Exercise', icon: '💪', category: 'fitness' },
  { name: 'Drink 8 Glasses Water', icon: '💧', category: 'diet' },
  { name: 'Read / Learn', icon: '📚', category: 'mental' },
];

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    let habits = await prisma.habit.findMany({
      where: { sessionId, isActive: true },
      include: {
        logs: { orderBy: { dateKey: 'desc' }, take: 91 },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!habits.length) {
      await prisma.habit.createMany({
        data: DEFAULT_HABITS.map((h) => ({ ...h, sessionId })),
      });
      habits = await prisma.habit.findMany({
        where: { sessionId, isActive: true },
        include: { logs: { orderBy: { dateKey: 'desc' }, take: 91 } },
        orderBy: { createdAt: 'asc' },
      });
    }

    const today = toDateKey();
    return NextResponse.json(
      habits.map((h) => ({
        ...h,
        logs: h.logs.map((l) => l.dateKey),
        completedToday: h.logs.some((l) => l.dateKey === today),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const { name, icon, category } = await req.json();
    const habit = await prisma.habit.create({
      data: { sessionId, name, icon: icon ?? '⭐', category: category ?? 'general' },
    });
    return NextResponse.json(habit);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
