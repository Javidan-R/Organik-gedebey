// src/app/api/admin/about-us/sections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsSections } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const sectionSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  description: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  sectionType: z.enum(['hero', 'story', 'values', 'cta']),
  metadata: z.any().optional(),
});

async function requireAuth(req: NextRequest) {
  const { requireAdminAuth } = await import('@/lib/auth');
  await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
}

export async function GET(req: NextRequest) {
  try {
    const sections = await db
      .select()
      .from(aboutUsSections)
      .where(eq(aboutUsSections.isActive, true))
      .orderBy(asc(aboutUsSections.displayOrder));

    return NextResponse.json(sections);
  } catch (error) {
    console.error('GET /about-us/sections error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const parsed = sectionSchema.parse(body);

    const [newSection] = await db
      .insert(aboutUsSections)
      .values({
        ...parsed,
        id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newSection, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /about-us/sections error:', message);
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      return NextResponse.json({ error: (error as any).message }, { status: (error as any).status });
    }
    return NextResponse.json({ error: (error as any)?.message || 'Server xətası' }, { status: 500 });
  }
}