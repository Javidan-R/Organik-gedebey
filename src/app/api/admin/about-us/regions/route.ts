// src/app/api/admin/about-us/regions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsRegions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const regionSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  featuredProducts: z.array(z.string()).nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

async function requireAuth(req: NextRequest) {
  const { requireAdminAuth } = await import('@/lib/auth');
  await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
}

export async function GET(req: NextRequest) {
  try {
    const regions = await db
      .select()
      .from(aboutUsRegions)
      .where(eq(aboutUsRegions.isActive, true))
      .orderBy(asc(aboutUsRegions.displayOrder));

    return NextResponse.json(regions);
  } catch (error) {
    console.error('GET /about-us/regions error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const parsed = regionSchema.parse(body);

    const [newRegion] = await db
      .insert(aboutUsRegions)
      .values({
        ...parsed,
        id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newRegion, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /about-us/regions error:', message);
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      return NextResponse.json({ error: (error as any).message }, { status: (error as any).status });
    }
    return NextResponse.json({ error: (error as any)?.message || 'Server xətası' }, { status: 500 });
  }
}