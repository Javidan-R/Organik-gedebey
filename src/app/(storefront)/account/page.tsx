// app/(storefront)/account/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import AccountClient from "./AccountClient";
 
export const metadata: Metadata = {
  title: 'Hesabım – Organik Gədəbəy',
  description: 'Organik Gədəbəy hesabım səhifəsi. Sifarişlərinizi izləyin, ünvanlarınızı idarə edin, istək siyahısı yaradın.',
  keywords: ['hesab', 'profil', 'sifariş izləmə', 'ünvan', 'istək siyahısı', 'kənd məhsulları', 'Gədəbəy'],
  robots: {
    index: false,
    follow: true,
  },
};

async function fetchData<T>(url: string): Promise<T | null> {
  const cookieStore = await cookies();  // 👈 await here
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}${url}`, {
      headers: { Cookie: cookieStore.toString() },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  // 🟢 `cookies()` is already awaited inside fetchData
  const [ordersData, wishlistData, addressesData, userData, analyticsData, loyaltyData, securityData] =
    await Promise.all([
      fetchData<{ orders: any[] }>("/api/account/orders"),
      fetchData<{ items: any[] }>("/api/account/wishlist"),
      fetchData<{ addresses: any[] }>("/api/account/addresses"),
      fetchData<{ user: any }>("/api/auth/me"),
      fetchData<any>("/api/account/analytics"),
      fetchData<any>("/api/account/loyalty"),
      fetchData<any>("/api/account/security"),
    ]);

  const orders = ordersData?.orders?.map((order) => ({ ...order, total: Number(order.total) })) ?? [];
  const wishlist = wishlistData?.items ?? [];
  const addresses = addressesData?.addresses ?? [];
  const user = userData?.user ?? null;
  const analytics = analyticsData ?? null;
  const loyalty = loyaltyData ?? null;
  const security = securityData ?? null;

  if (!user) redirect("/login");

  return (
    <AccountClient
      initialUser={user}
      initialOrders={orders}
      initialWishlist={wishlist}
      initialAddresses={addresses}
      initialPreferences={user.preferences || {}}
      initialAnalytics={analytics}
      initialLoyalty={loyalty}
      initialSecurity={security}
    />
  );
}