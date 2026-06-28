import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f3f9e7] to-white">
      <div className="text-center px-6">
        <Leaf className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
        <h1 className="text-6xl font-black text-emerald-900 mb-4">404</h1>
        <p className="text-xl text-emerald-700 mb-8">Səhifə tapılmadı</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}