// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Əvvəlcə middleware-in admin cookie-sini yoxlayırıq
  const adminCookie = req.cookies.get('og_admin')?.value === 'ok';
  if (!adminCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Cookie-dən istifadəçi məlumatlarını oxuyuruq
  const authCookie = req.cookies.get('og_auth')?.value;
  if (authCookie) {
    try {
      const userData = JSON.parse(authCookie);
      // Əgər id fallback-admindirsə, DB sorğusuna getmədən birbaşa qaytar
      if (userData.id === 'fallback-admin' || userData.id === 'env-admin') {
        return NextResponse.json({
          user: {
            id: userData.id,
            email: userData.email,
            firstName: userData.name,
            lastName: '',
            role: userData.role.toUpperCase(),
            isBlocked: false,
            totalSpent: 0,
            totalOrders: 0,
            loyaltyPoints: 0,
          },
        });
      }
      // Əgər id realdırsa, DB-dən yoxla (əgər DB varsa)
      // Bu hissəni sizin tələbinizə uyğun olaraq sadecə fallback qaytarırıq
      // İstəsəniz DB sorgusunu əlavə edə bilərsiniz
    } catch {}
  }

  // Fallback admin məlumatı
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