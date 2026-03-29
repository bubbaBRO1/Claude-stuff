import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { getOrCreateSession } from '../../../lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = await getOrCreateSession();
    const { id } = await params;
    const { completed } = await req.json();
    const goal = await prisma.goal.updateMany({
      where: { id, sessionId },
      data: { completed },
    });
    return NextResponse.json(goal);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = await getOrCreateSession();
    const { id } = await params;
    await prisma.goal.deleteMany({ where: { id, sessionId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
