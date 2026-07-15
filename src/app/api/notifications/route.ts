// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, [
      'ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF',
    ]);

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const notifications = await NotificationService.getForUser(user.id, limit);

    return NextResponse.json(
      { notifications },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[Notifications API] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}