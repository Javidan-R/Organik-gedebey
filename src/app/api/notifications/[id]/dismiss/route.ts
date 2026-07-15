// src/app/api/notifications/[id]/dismiss/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth(request, [
      'ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF',
    ]);

    const deleted = await NotificationService.dismiss(user.id, id);

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Bildiriş tapılmadı və ya silinmə icazəniz yoxdur' },
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
    console.error('[Notifications API] Dismiss error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}