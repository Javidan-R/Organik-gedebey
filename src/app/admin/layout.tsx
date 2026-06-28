import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: {
    template: "%s | Organik Gədəbəy Admin",
    default: "Admin Panel | Organik Gədəbəy",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // ✅ BUG FIX 1: Static import YOX — login səhifəsində AdminClientLayout
  // render olunurdu → useAdminAuth() çağırılırdı → /api/auth/me loop edirdi.
  // Həll: login üçün birbaşa children qaytar, heç bir layout yox.
  const isLoginPage =
    pathname === "/admin/login" ||
    pathname === "" ||
    pathname === "/admin/login/";

  if (isLoginPage) {
    return <>{children}</>;
  }

  // ✅ Dynamic import: yalnız real admin səhifələrində yüklənir
  const { default: AdminClientLayout } = await import(
    "./AdminClientLayout"
  );

  return <AdminClientLayout>{children}</AdminClientLayout>;
}