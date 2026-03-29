import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';
import { toDateKey } from '../../lib/streak';

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const today = toDateKey();
    const goals = await prisma.goal.findMany({
      where: { sessionId, dateKey: today },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(goals);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const today = toDateKey();
    const { text } = await req.json();
    const goal = await prisma.goal.create({
      data: { sessionId, text, dateKey: today },
    });
    return NextResponse.json(goal);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
