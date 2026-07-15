// src/app/api/notifications/unread-count/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, [
      'ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF',
    ]);

    const count = await NotificationService.getUnreadCount(user.id);

    return NextResponse.json(
      { count },
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
    console.error('[Notifications API] Unread count error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}