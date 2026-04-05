import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...lead, tags: JSON.parse(lead.tags as string) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { tags, ...rest } = body;

  const lead = await db.lead.update({
    where: { id },
    data: {
      ...rest,
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
    },
  });

  return NextResponse.json({ ...lead, tags: JSON.parse(lead.tags as string) });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
