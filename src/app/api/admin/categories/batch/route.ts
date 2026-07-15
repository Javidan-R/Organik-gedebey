// src/app/api/admin/categories/batch/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const batchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['archive', 'unarchive', 'activate', 'deactivate', 'delete']),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const body = await request.json();
    const { ids, action } = batchSchema.parse(body);

    let result;

    switch (action) {
      case 'archive':
        result = await db
          .update(categories)
          .set({
            archived: true,
            isActive: false,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(inArray(categories.id, ids))
          .returning({ id: categories.id });
        break;

      case 'unarchive':
        result = await db
          .update(categories)
          .set({
            archived: false,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(inArray(categories.id, ids))
          .returning({ id: categories.id });
        break;

      case 'activate':
        result = await db
          .update(categories)
          .set({
            isActive: true,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(inArray(categories.id, ids))
          .returning({ id: categories.id });
        break;

      case 'deactivate':
        result = await db
          .update(categories)
          .set({
            isActive: false,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(inArray(categories.id, ids))
          .returning({ id: categories.id });
        break;

      case 'delete':
        // Əvvəlcə alt kateqoriyaları yoxla
        const children = await db
          .select({ parentId: categories.parentId })
          .from(categories)
          .where(inArray(categories.parentId, ids));
        if (children.length > 0) {
          return NextResponse.json(
            {
              error: 'Seçilmiş kateqoriyaların alt kateqoriyaları var. Əvvəlcə onları silin.',
              hasChildren: true,
            },
            { status: 400 }
          );
        }
        result = await db
          .delete(categories)
          .where(inArray(categories.id, ids))
          .returning({ id: categories.id });
        break;

      default:
        return NextResponse.json({ error: 'Dəstəklənməyən əməliyyat' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      action,
    });
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
    logger.error('Category batch error:', { error });
    return NextResponse.json({ error: 'Batch əməliyyatı uğursuz oldu' }, { status: 500 });
  }
}