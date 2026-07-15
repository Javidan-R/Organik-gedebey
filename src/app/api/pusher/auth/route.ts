// src/app/api/pusher/auth/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import Pusher from 'pusher';

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, [
      'ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF',
    ]);

    const body = await request.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    const expectedChannel = `private-user-${user.id}`;
    if (channel_name !== expectedChannel) {
      return NextResponse.json(
        { error: 'Forbidden channel' },
        { status: 403 }
      );
    }

    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || '',
      useTLS: true,
    });

    const auth = pusher.authorizeChannel(socket_id, channel_name);

    return NextResponse.json(auth);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[Pusher Auth] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}