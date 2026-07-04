// src/app/api/notifications/[id]/dismiss/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);
    
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, params.id), eq(notifications.userId, user.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Dismiss notification error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}