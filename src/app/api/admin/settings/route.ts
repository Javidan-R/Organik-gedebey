import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Hər hansı bir açar‑dəyər cütlüyünü qəbul edən açıq sxem
const updateSettingsSchema = z.record(z.string(), z.any());

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);

    const allSettings = await db.query.settings.findMany();
    const settingsObj = allSettings.reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body); // istənilən sahə

    const updates = Object.entries(validatedData).map(async ([key, value]) => {
      const existing = await db.query.settings.findFirst({
        where: eq(settings.key, key),
      });

      if (existing) {
        return db
          .update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.key, key));
      } else {
        return db
          .insert(settings)
          .values({ key, value, updatedAt: new Date() });
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ message: 'Tənzimləmələr uğurla yeniləndi' });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}