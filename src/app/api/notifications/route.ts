// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);
    
    const notificationsData = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json({ notifications: notificationsData });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}