// src/app/api/baskets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { baskets, basketMedia, basketVariants, basketContents, basketExtras } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const whereClause = [
      eq(baskets.isActive, true),
      eq(baskets.archived, false),
    ];
    if (type) {
      whereClause.push(eq(baskets.type, type as any));
    }

    const basketsData = await (db.query as any).baskets.findMany({
      where: and(...whereClause),
      with: {
        media: {
          orderBy: [basketMedia.displayOrder],
        },
        variants: {
          with: {
            contents: {
              orderBy: [basketContents.displayOrder],
            },
            extras: {
              orderBy: [basketExtras.displayOrder],
            },
          },
        },
      },
      orderBy: [desc(baskets.displayOrder), desc(baskets.createdAt)],
      limit,
      offset,
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(baskets)
      .where(and(...whereClause));

    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      baskets: basketsData,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Public baskets GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}