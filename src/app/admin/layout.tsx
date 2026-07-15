// src/app/admin/layout.tsx

import type { Metadata } from "next";
import { Providers } from '@/app/providers';
import AdminClientLayout from "./AdminClientLayout";

export const metadata: Metadata = {
  title: { template: "%s | Yaylaq Admin", default: "Admin Panel" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminClientLayout>{children}</AdminClientLayout>
    </Providers>
  );
}