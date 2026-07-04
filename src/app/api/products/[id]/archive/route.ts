// ============================================================
// src/app/api/products/[id]/archive/route.ts
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const exists = await db.query.products.findFirst({
      where: eq(products.id, id),
      columns: { id: true, archived: true },
    });

    if (!exists) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 });
    }

    if (exists.archived) {
      return NextResponse.json(
        { error: 'Məhsul artıq arxivdədir' },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(products)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id, archived: products.archived });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('PATCH /api/products/[id]/archive error:', error);
    return NextResponse.json({ error: 'Arxivləmə xətası' }, { status: 500 });
  }
}