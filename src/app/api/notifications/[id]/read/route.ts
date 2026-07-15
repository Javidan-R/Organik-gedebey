// src/app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth(request, [
      'ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF',
    ]);

    const updated = await NotificationService.markAsRead(user.id, id);

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Bildiriş tapılmadı və ya icazəniz yoxdur' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[Notifications API] Mark as read error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}