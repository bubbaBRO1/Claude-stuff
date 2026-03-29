import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { toDateKey } from '../../../../lib/streak';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dateKey = toDateKey();
    await prisma.habitLog.upsert({
      where: { habitId_dateKey: { habitId: id, dateKey } },
      create: { habitId: id, dateKey },
      update: {},
    });
    return NextResponse.json({ success: true, dateKey });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dateKey = toDateKey();
    await prisma.habitLog.deleteMany({
      where: { habitId: id, dateKey },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
