// src/app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);
    
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}