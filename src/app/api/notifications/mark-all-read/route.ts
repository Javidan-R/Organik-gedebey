// src/app/api/notifications/mark-all-read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, [
      'ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF',
    ]);

    const updated = await NotificationService.markAllAsRead(user.id);

    return NextResponse.json(
      { success: true, count: updated.length },
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
    console.error('[Notifications API] Mark all read error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}