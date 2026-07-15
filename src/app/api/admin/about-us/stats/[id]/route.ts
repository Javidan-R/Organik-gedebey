// src/app/api/admin/about-us/stats/[id]/route.ts (refactored)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, AuthError } from '@/lib/auth';

const statUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await req.json();
    const parsed = statUpdateSchema.parse(body);

    const [updated] = await db
      .update(aboutUsStats)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(aboutUsStats.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Statistika tapılmadı' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('PUT /admin/about-us/stats/[id] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    await db.delete(aboutUsStats).where(eq(aboutUsStats.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('DELETE /admin/about-us/stats/[id] error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}