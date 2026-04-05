import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const leads = await db.lead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { company: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    leads.map((l) => ({ ...l, tags: JSON.parse(l.tags as string) }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, company, industry, tags = [], status = "new", notes, source = "manual" } = body;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const lead = await db.lead.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      company: company || null,
      industry: industry || null,
      tags: JSON.stringify(tags),
      status,
      notes: notes || null,
      source,
    },
  });

  return NextResponse.json({ ...lead, tags: JSON.parse(lead.tags as string) }, { status: 201 });
}
