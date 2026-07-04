// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    // `requireAuth` JWT token-dan istifadəçi məlumatlarını qaytarır
    const user = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);

    // 🔥 Dev mühitində "dev-admin-id" kimi UUID olmayan ID-lər üçün mock cavab qaytar
    if (!UUID_REGEX.test(user.user.id)) {
      // Yalnız development mühitində icazə veririk
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          user: {
            id: user.user.id,
            email: user.user.email || 'dev@admin.com',
            firstName: 'Dev',
            lastName: 'Admin',
            role: user.user.role || 'ADMIN',
            isActive: true,
            isBlocked: false,
            avatarUrl: null,
            lastLoginAt: new Date().toISOString(),
            totalOrders: 0,
            totalSpent: 0,
            loyaltyPoints: 0,
            name: 'Dev Admin',
            type: 'admin',
          },
        });
      }
      // Production-da səhv mesajı
      return NextResponse.json(
        { error: 'İstifadəçi ID-si etibarsızdır' },
        { status: 400 }
      );
    }

    // ✅ Əgər ID UUID formatındadırsa, verilənlər bazasından istifadəçini gətir
    const [userData] = await db
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
        totalOrders: users.totalOrders,
        totalSpent: users.totalSpent,
        loyaltyPoints: users.loyaltyPoints,
      })
      .from(users)
      .where(eq(users.id, user.user.id))
      .limit(1);

    if (!userData) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...userData,
        name: [userData.firstName, userData.lastName].filter(Boolean).join(' '),
        type: 'admin',
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