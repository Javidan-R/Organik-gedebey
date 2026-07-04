// src/app/api/baskets/[slug]/route.ts
// Tək səbət — slug ilə (public)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  baskets,
  basketMedia,
  basketVariants,
  basketContents,
  basketExtras,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const basket = await db
      .select()
      .from(baskets)
      .where(eq(baskets.slug, params.slug))
      .then(async ([b]) => {
        if (!b) return null;

        const variants = await db
          .select()
          .from(basketVariants)
          .where(eq(basketVariants.basketId, b.id));

        const variantIds = variants.map((v) => v.id);

        const contents =
          variantIds.length > 0
            ? await db
                .select()
                .from(basketContents)
                .where(inArray(basketContents.basketVariantId, variantIds))
            : [];

        const extras =
          variantIds.length > 0
            ? await db
                .select()
                .from(basketExtras)
                .where(inArray(basketExtras.basketVariantId, variantIds))
            : [];

        const media = await db
          .select()
          .from(basketMedia)
          .where(eq(basketMedia.basketId, b.id));

        return {
          ...b,
          variants: variants.map((v) => ({
            ...v,
            contents: contents.filter((c) => c.basketVariantId === v.id),
            extras: extras.filter((e) => e.basketVariantId === v.id),
          })),
          media,
        };
      });

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 });
    }

    return NextResponse.json({ basket });
  } catch (error) {
    console.error('[baskets/[slug]] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}