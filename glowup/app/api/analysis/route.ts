import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const body = await req.json();
    const { overallScore, potentialScore, featuresJson, summary } = body;

    const analysis = await prisma.analysis.create({
      data: {
        sessionId,
        overallScore,
        potentialScore,
        featuresJson: JSON.stringify(featuresJson),
        summary,
      },
    });

    return NextResponse.json(analysis);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();
    const analyses = await prisma.analysis.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(analyses);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}
