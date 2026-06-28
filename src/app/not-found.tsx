// app/not-found.tsx
import Link from "next/link";
import { Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
      <div className="text-center space-y-4">
        <Leaf className="w-16 h-16 text-emerald-500 mx-auto" />
        <h1 className="text-4xl font-black text-slate-800">404 – Səhifə tapılmadı</h1>
        <p className="text-slate-600">Axtardığınız məhsul mövcud deyil və ya silinib.</p>
        <Link href="/products" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-full font-bold">
          Məhsullara qayıt
        </Link>
      </div>
    </div>
  );
}