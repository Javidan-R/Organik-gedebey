// src/app/api/admin/about-us/regions/[id]/route.ts (full refactored)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsRegions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, AuthError } from '@/lib/auth';

const regionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  featuredProducts: z.array(z.string()).nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await request.json();
    const parsed = regionUpdateSchema.parse(body);

    const [updated] = await db
      .update(aboutUsRegions)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(aboutUsRegions.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Region tapılmadı' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('PUT /admin/about-us/regions/[id] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    await db.delete(aboutUsRegions).where(eq(aboutUsRegions.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('DELETE /admin/about-us/regions/[id] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}