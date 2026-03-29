import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const budget = searchParams.get('budget');
    const tags = searchParams.get('tags');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) where.category = category;
    if (budget) {
      const ranges: Record<string, { priceMin?: number; priceMax?: number }> = {
        'under-25': { priceMax: 25 },
        '25-50': { priceMin: 25, priceMax: 50 },
        '50-100': { priceMin: 50, priceMax: 100 },
        '100+': { priceMin: 100 },
      };
      const range = ranges[budget];
      if (range?.priceMin !== undefined) where.priceMin = { gte: range.priceMin };
      if (range?.priceMax !== undefined) where.priceMax = { lte: range.priceMax };
    }

    let products = await prisma.product.findMany({ where });

    if (tags) {
      const tagList = tags.split(',');
      products = products.filter((p) => {
        const pTags = JSON.parse(p.tags) as string[];
        return tagList.some((t) => pTags.includes(t));
      });
    }

    return NextResponse.json(products);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
