import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Əvvəlcə middleware-in admin cookie-sini yoxlayırıq
  const adminCookie = req.cookies.get('og_admin')?.value === 'ok';
  if (!adminCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Cookie-dən email və role məlumatlarını çıxaraq (opsional)
  // Lakin biz static admin məlumatı qaytarırıq
  return NextResponse.json({
    user: {
      id: 'fallback-admin',
      email: 'admin@organikgedebey.az',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isBlocked: false,
      totalSpent: 0,
      totalOrders: 0,
      loyaltyPoints: 0,
    },
  });
}