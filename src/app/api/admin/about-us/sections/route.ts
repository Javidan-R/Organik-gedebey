// src/app/api/admin/about-us/sections/route.ts (full refactored)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aboutUsSections } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, AuthError } from '@/lib/auth';

const sectionSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  description: z.string().min(1),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  videoUrl: z.string().url().nullable().optional().or(z.literal('')),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  sectionType: z.enum(['hero', 'story', 'values', 'regions', 'team', 'cta']),
  metadata: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const sections = await db
      .select()
      .from(aboutUsSections)
      .orderBy(asc(aboutUsSections.displayOrder));

    return NextResponse.json(sections);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /admin/about-us/sections error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await request.json();
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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('POST /admin/about-us/sections error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}