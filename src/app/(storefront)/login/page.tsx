// app/(storefront)/login/page.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Leaf, Mail, Lock, Loader2, Star, ChevronRight, AlertCircle, Sparkles,  Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useApp } from "@/lib/store";
import Link from "next/link";
 
export default function UserLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const { login, hasHydrated } = useAuth();
  const products = useApp((s) => s.products) || [];
  
  // Real məhsullardan ilk 3-ü göstər
  const featuredProducts = products.slice(0, 3).map(p => ({
    id: p.id,
    name: p.name,
    price: `₼${Number(p.price || 0).toFixed(2)}`,
    rating: 4.9,
    image: p.images?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E'
  }));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email və şifrə daxil edin");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err.message || "Giriş uğursuz oldu");
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-xl">🌿</div>
            <span className="font-black text-gray-800 text-lg">Organik Gədəbəy</span>
          </div>
          <Link href="/signup" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">
            Qeydiyyat
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left Column - Login Form */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-3xl sm:text-4xl mx-auto mb-4 shadow-lg">
                <Leaf className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Hesaba giriş</h1>
              <p className="text-slate-500 text-sm sm:text-base">Organik Gədəbəy ailəsinə xoş gəldiniz</p>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-100 shadow-xl p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-16 translate-x-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-50 rounded-full translate-y-12 -translate-x-12 opacity-50" />

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                      placeholder="sizin@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Şifrə</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-emerald-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-200"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
                  Daxil ol
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Hesabınız yoxdur?{" "}
                <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-emerald-600 font-semibold hover:underline">
                  Qeydiyyatdan keçin
                </Link>
              </p>
            </div>
          </div>

          {/* Right Column - Real Products */}
          <div className="hidden lg:block space-y-8">
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Xüsusi Təklif</span>
                </div>
                <h2 className="text-3xl font-black mb-3">İlk sifarişinizə 20% endirim!</h2>
                <p className="text-emerald-100 mb-6">Qeydiyyatdan keçin və təzə, organik məhsullarla tanış olun.</p>
                <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
                  İndi qeydiyyatdan keçin
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Featured Products */}
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-6">
              <h3 className="text-xl font-black text-slate-800 mb-4">Populyar Məhsullar</h3>
              <div className="space-y-4">
                {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl hover:from-emerald-100 hover:to-green-100 transition-all cursor-pointer group">
                  
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs text-slate-600">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-600">{product.price}</div>
                      <div className="text-xs text-slate-400">kq</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400 text-center">Hələ məhsul yoxdur</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}