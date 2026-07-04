// src/app/api/admin/about-us/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsStats } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const statSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

async function requireAuth(req: NextRequest) {
  const { requireAdminAuth } = await import('@/lib/auth');
  await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
}

export async function GET(req: NextRequest) {
  try {
    const stats = await db
      .select()
      .from(aboutUsStats)
      .where(eq(aboutUsStats.isActive, true))
      .orderBy(asc(aboutUsStats.displayOrder));

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /about-us/stats error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const parsed = statSchema.parse(body);

    const [newStat] = await db
      .insert(aboutUsStats)
      .values({
        ...parsed,
        id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newStat, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /about-us/stats error:', message);
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      return NextResponse.json({ error: (error as any).message }, { status: (error as any).status });
    }
    return NextResponse.json({ error: (error as any)?.message || 'Server xətası' }, { status: 500 });
  }
}