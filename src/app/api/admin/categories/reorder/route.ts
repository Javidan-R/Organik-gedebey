// src/app/api/admin/categories/reorder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().min(0),
      parentId: z.string().uuid().nullable(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const body = await request.json();
    const { items } = reorderSchema.parse(body);

    // Transaction ilə bütün yeniləmələri et
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(categories)
          .set({
            displayOrder: item.displayOrder,
            parentId: item.parentId,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(eq(categories.id, item.id));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasiya xətası', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Category reorder error:', { error });
    return NextResponse.json({ error: 'Sıralama yenilənə bilmədi' }, { status: 500 });
  }
}