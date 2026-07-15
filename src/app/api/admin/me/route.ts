// src/app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
   const { user: authUser } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);
const [user] = await db
  .select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    role: users.role,
    isActive: users.isActive,
    isBlocked: users.isBlocked,
    avatarUrl: users.avatarUrl,
    lastLoginAt: users.lastLoginAt,
  })
  .from(users)
  .where(eq(users.id, authUser.id))
  .limit(1);

if (!user) {
  return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 });
}

return NextResponse.json({
  user: {
    ...user,
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
  },
});
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin me GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}