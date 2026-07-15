// src/app/api/admin/categories/tree/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { buildCategoryTree } from '@/lib/category-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const whereConditions = [];
    if (!includeArchived) {
      whereConditions.push(eq(categories.archived, false));
    }

    const allCategories = await db.query.categories.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(categories.isFeatured), desc(categories.displayOrder), desc(categories.createdAt)],
    });

    // Kateqoriyaları ağac strukturuna çevir
    const tree = buildCategoryTree(allCategories as any);

    return NextResponse.json({ tree });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Category tree GET error:', { error });
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}