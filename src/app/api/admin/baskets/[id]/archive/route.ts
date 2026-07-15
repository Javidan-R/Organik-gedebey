// src/app/api/admin/baskets/[id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { baskets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const { id } = params;

    // Basketin mövcudluğunu yoxla
    const [existing] = await db
      .select({ id: baskets.id, archived: baskets.archived })
      .from(baskets)
      .where(eq(baskets.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Səbət tapılmadı' },
        { status: 404 }
      );
    }

    if (existing.archived) {
      return NextResponse.json(
        { error: 'Səbət artıq arxivləşdirilib' },
        { status: 409 }
      );
    }

    await db
      .update(baskets)
      .set({
        archived: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(baskets.id, id));

    return NextResponse.json({
      message: 'Səbət arxivləşdirildi',
      success: true,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error(`[Basket ${params.id} archive]`, error);
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    );
  }
}