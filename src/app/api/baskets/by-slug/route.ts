// src/app/api/baskets/by-slug/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  baskets,
  basketVariants,
  basketContents,
  basketExtras,
  basketMedia,
  basketProducts,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const [basket] = await db
      .select()
      .from(baskets)
      .where(eq(baskets.slug, slug));

    if (!basket) {
      return NextResponse.json(
        { error: 'Səbət tapılmadı' },
        { status: 404 }
      );
    }

    const variants = await db
      .select()
      .from(basketVariants)
      .where(eq(basketVariants.basketId, basket.id));
    const variantIds = variants.map((v) => v.id);

    const contents = variantIds.length
      ? await db
          .select()
          .from(basketContents)
          .where(inArray(basketContents.basketVariantId, variantIds))
      : [];
    const extras = variantIds.length
      ? await db
          .select()
          .from(basketExtras)
          .where(inArray(basketExtras.basketVariantId, variantIds))
      : [];
    const products = await db
      .select()
      .from(basketProducts)
      .where(eq(basketProducts.basketId, basket.id));
    const media = await db
      .select()
      .from(basketMedia)
      .where(eq(basketMedia.basketId, basket.id));

    const enriched = {
      ...basket,
      variants: variants.map((v) => ({
        ...v,
        contents: contents.filter(
          (c) => c.basketVariantId === v.id
        ),
        extras: extras.filter((e) => e.basketVariantId === v.id),
      })),
      products,
      media,
    };

    return NextResponse.json({ basket: enriched });
  } catch (error) {
    logger.error(`Public basket by slug ${slug} GET error`, error);
    return NextResponse.json(
      { error: 'Server xətası' },
      { status: 500 }
    );
  }
}