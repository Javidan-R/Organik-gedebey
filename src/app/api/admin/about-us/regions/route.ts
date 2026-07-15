// src/app/api/admin/about-us/regions/route.ts (full refactored)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsRegions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, AuthError } from '@/lib/auth';

const regionSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  featuredProducts: z.array(z.string()).nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const regions = await db
      .select()
      .from(aboutUsRegions)
      .orderBy(asc(aboutUsRegions.displayOrder));

    return NextResponse.json(regions);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /admin/about-us/regions error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await request.json();
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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('POST /admin/about-us/regions error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}