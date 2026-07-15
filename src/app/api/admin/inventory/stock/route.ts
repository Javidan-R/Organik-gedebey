// src/app/api/admin/inventory/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productVariants, inventoryLogs, products } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth';
import { z } from 'zod';

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  delta: z.number().int().refine(v => v !== 0, 'Delta sıfır ola bilməz'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN']);

    const body = await request.json();
    const { productId, variantId, delta, notes } = adjustStockSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Cari stoku oxu (lock)
      const [variant] = await tx
        .select({ stock: productVariants.stock, productId: productVariants.productId, name: productVariants.name })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (!variant) {
        throw new Error('Variant tapılmadı');
      }

      const oldStock = variant.stock;
      const newStock = oldStock + delta;

      if (newStock < 0) {
        throw new Error('Stok mənfi ola bilməz');
      }

      // 2. Stoku yenilə
      await tx
        .update(productVariants)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(productVariants.id, variantId));

      // 3. Inventory log yaz
      const [log] = await tx
        .insert(inventoryLogs)
        .values({
          productId: variant.productId,
          variantId,
          type: delta > 0 ? 'ADJUSTMENT' : 'SALE',
          qtyChange: delta,
          qtyBefore: oldStock,
          qtyAfter: newStock,
          unit: 'ədəd',
          refType: 'MANUAL',
          refId: null,
          notes: notes || `Manual stok dəyişikliyi (${delta > 0 ? '+' : ''}${delta})`,
          createdBy: user.id,
          createdAt: new Date(),
        })
        .returning();

      return { newStock, log };
    });

    return NextResponse.json({
      success: true,
      newStock: result.newStock,
      logId: result.log.id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('Stok mənfi ola bilməz')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[inventory/stock] POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}