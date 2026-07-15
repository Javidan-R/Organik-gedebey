// src/app/api/admin/about-us/stats/route.ts (full refactored)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsStats } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, AuthError } from '@/lib/auth';

const statSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const stats = await db
      .select()
      .from(aboutUsStats)
      .orderBy(asc(aboutUsStats.displayOrder));

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /admin/about-us/stats error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await request.json();
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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('POST /admin/about-us/stats error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}