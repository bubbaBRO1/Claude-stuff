import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';

function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const weekKey = getISOWeekKey(new Date());
    const review = await prisma.weeklyReview.findUnique({
      where: { sessionId_weekKey: { sessionId, weekKey } },
    });
    return NextResponse.json({ review, weekKey });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const weekKey = getISOWeekKey(new Date());
    const { rating, note } = await req.json();
    const review = await prisma.weeklyReview.upsert({
      where: { sessionId_weekKey: { sessionId, weekKey } },
      update: { rating, note },
      create: { sessionId, weekKey, rating, note },
    });
    return NextResponse.json(review);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
