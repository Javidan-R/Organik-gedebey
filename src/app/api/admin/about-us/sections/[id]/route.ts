// src/app/api/admin/about-us/sections/[id]/route.ts (full refactored)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsSections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, AuthError } from '@/lib/auth';

const sectionUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  videoUrl: z.string().url().nullable().optional().or(z.literal('')),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  sectionType: z.enum(['hero', 'story', 'values', 'regions', 'team', 'cta']).optional(),
  metadata: z.any().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await request.json();
    const parsed = sectionUpdateSchema.parse(body);

    const [updated] = await db
      .update(aboutUsSections)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(aboutUsSections.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Bölmə tapılmadı' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('PUT /admin/about-us/sections/[id] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    await db.delete(aboutUsSections).where(eq(aboutUsSections.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('DELETE /admin/about-us/sections/[id] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}