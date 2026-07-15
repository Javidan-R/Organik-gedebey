// src/app/api/baskets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  baskets,
  basketMedia,
  basketVariants,
  basketContents,
  basketExtras,
  basketProducts,
} from '@/lib/db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

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

    const basketsData = await db
      .select()
      .from(baskets)
      .where(and(...whereClause))
      .orderBy(desc(baskets.displayOrder), desc(baskets.createdAt))
      .limit(limit)
      .offset(offset);

    if (basketsData.length === 0) {
      return NextResponse.json({
        baskets: [],
        pagination: { total: 0, limit, offset, totalPages: 0 },
      });
    }

    const basketIds = basketsData.map((b) => b.id);

    // Əlaqəli məlumatları inArray ilə çək
    const mediaData = basketIds.length
      ? await db
          .select()
          .from(basketMedia)
          .where(inArray(basketMedia.basketId, basketIds))
      : [];
    const variantData = basketIds.length
      ? await db
          .select()
          .from(basketVariants)
          .where(inArray(basketVariants.basketId, basketIds))
      : [];
    const productData = basketIds.length
      ? await db
          .select()
          .from(basketProducts)
          .where(inArray(basketProducts.basketId, basketIds))
      : [];

    const variantIds = variantData.map((v) => v.id);
    const contentsData = variantIds.length
      ? await db
          .select()
          .from(basketContents)
          .where(inArray(basketContents.basketVariantId, variantIds))
      : [];
    const extrasData = variantIds.length
      ? await db
          .select()
          .from(basketExtras)
          .where(inArray(basketExtras.basketVariantId, variantIds))
      : [];

    const enrichedBaskets = basketsData.map((basket) => ({
      ...basket,
      media: mediaData.filter((m) => m.basketId === basket.id),
      variants: variantData
        .filter((v) => v.basketId === basket.id)
        .map((v) => ({
          ...v,
          contents: contentsData.filter(
            (c) => c.basketVariantId === v.id
          ),
          extras: extrasData.filter(
            (e) => e.basketVariantId === v.id
          ),
        })),
      products: productData.filter((p) => p.basketId === basket.id),
    }));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(baskets)
      .where(and(...whereClause));
    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      baskets: enrichedBaskets,
      pagination: { total, limit, offset, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Public baskets GET error', error);
    return NextResponse.json(
      {
        error: 'Server xətası',
        baskets: [],
        pagination: { total: 0, limit: 0, offset: 0, totalPages: 0 },
      },
      { status: 500 }
    );
  }
}