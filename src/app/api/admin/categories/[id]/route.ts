// src/app/api/admin/categories/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { generateCategorySlug } from '@/lib/category-helpers';

const updateCategorySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z.string().min(2).max(255).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageId: z.string().nullable().optional(),
  imageAlt: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  icon: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  archived: z.boolean().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  metaKeywords: z.string().nullable().optional(),
});

// ─── GET: Tək kateqoriya ──────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const { id } = await params;

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        products: {
          columns: { id: true },
        },
        parent: true,
        children: {
          where: and(eq(categories.isActive, true), eq(categories.archived, false)),
          columns: { id: true, name: true, slug: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Kateqoriya tapılmadı' }, { status: 404 });
    }

    const formatted = {
      ...category,
      productsCount: category.products?.length || 0,
      _count: { products: category.products?.length || 0 },
    };

    return NextResponse.json(formatted);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Admin category GET error:', { error });
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── PUT: Kateqoriyanı yenilə ─────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const { id } = await params;

    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    // Kateqoriyanın mövcudluğunu yoxla
    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kateqoriya tapılmadı' }, { status: 404 });
    }

    // Əgər slug dəyişirsə, unikallığını yoxla
    let slug = validated.slug;
    if (slug && slug !== existing.slug) {
      const duplicate = await db.query.categories.findFirst({
        where: and(eq(categories.slug, slug), eq(categories.id, id)),
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Bu slug artıq istifadə olunur' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedBy: user.id,
      updatedAt: new Date(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = slug;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.imageUrl !== undefined) updateData.imageUrl = validated.imageUrl;
    if (validated.imageId !== undefined) updateData.imageId = validated.imageId;
    if (validated.imageAlt !== undefined) updateData.imageAlt = validated.imageAlt;
    if (validated.color !== undefined) updateData.color = validated.color;
    if (validated.icon !== undefined) updateData.icon = validated.icon;
    if (validated.parentId !== undefined) updateData.parentId = validated.parentId;
    if (validated.displayOrder !== undefined) updateData.displayOrder = validated.displayOrder;
    if (validated.isFeatured !== undefined) updateData.isFeatured = validated.isFeatured;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.archived !== undefined) updateData.archived = validated.archived;
    if (validated.metaTitle !== undefined) updateData.metaTitle = validated.metaTitle;
    if (validated.metaDescription !== undefined) updateData.metaDescription = validated.metaDescription;
    if (validated.metaKeywords !== undefined) updateData.metaKeywords = validated.metaKeywords;

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(updated);
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
    logger.error('Admin category PUT error:', { error });
    return NextResponse.json({ error: 'Kateqoriya yenilənə bilmədi' }, { status: 500 });
  }
}

// ─── DELETE: Kateqoriyanı sil (və ya arxivlə) ────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const { id } = await params;

    const searchParams = request.nextUrl.searchParams;
    const permanent = searchParams.get('permanent') === 'true';

    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        children: { columns: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kateqoriya tapılmadı' }, { status: 404 });
    }

    if (existing.children && existing.children.length > 0 && !permanent) {
      return NextResponse.json(
        {
          error: 'Bu kateqoriyanın alt kateqoriyaları var. Əvvəlcə onları silin və ya daşıyın.',
          hasChildren: true,
        },
        { status: 400 }
      );
    }

    if (permanent) {
      // Əgər alt kateqoriyalar varsa, onları da sil (cascade)
      await db.delete(categories).where(eq(categories.id, id));
      return NextResponse.json({ success: true, permanent: true });
    } else {
      // Arxivlə
      const [archived] = await db
        .update(categories)
        .set({
          archived: true,
          isActive: false,
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      return NextResponse.json({ success: true, archived });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Admin category DELETE error:', { error });
    return NextResponse.json({ error: 'Kateqoriya silinə bilmədi' }, { status: 500 });
  }
}