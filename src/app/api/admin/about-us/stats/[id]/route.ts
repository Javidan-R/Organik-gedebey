// src/app/api/admin/about-us/stats/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const statUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

async function requireAuth(req: NextRequest): Promise<void> {
  const { requireAdminAuth } = await import('@/lib/auth');
  await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
}

function handleError(error: unknown): NextResponse {
  const logPayload = error instanceof Error ? error.message : (error as Record<string, unknown>);
  console.error('[about-us/stats/[id]] error:', logPayload);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validasiya xətası', details: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    if ('status' in error && 'message' in error) {
      return NextResponse.json(
        { error: (error as any).message },
        { status: (error as any).status }
      );
    }
    return NextResponse.json({ error: error.message || 'Server xətası' }, { status: 500 });
  }
  return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
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
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    await db.delete(aboutUsStats).where(eq(aboutUsStats.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleError(error);
  }
}