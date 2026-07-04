"use client";
 
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  Shield, Eye, EyeOff, Loader2, Leaf, Lock, Mail,
  AlertCircle, CheckCircle2, ArrowRight, Fingerprint,
} from "lucide-react";

type LoginState = "idle" | "loading" | "success" | "error";

function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-pulse"
          style={{
            left: `${15 + i * 15}%`,
            top: `${10 + (i % 3) * 30}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2 + i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

// Sabit className - hydration uyğunluğu üçün
const INPUT_CLASSNAME =
  "w-full pl-10 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  suffix,
  disabled,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ElementType;
  suffix?: React.ReactNode;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={INPUT_CLASSNAME}
          required
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
    </div>
  );
}

function LoginFormInner() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("next") || "/admin/dashboard";
  // Open redirect qoruması — yalnız /admin/* yollarına icazə ver
  const safeCallbackUrl =
    rawCallback.startsWith("/admin") && !rawCallback.startsWith("/admin/login")
      ? rawCallback
      : "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    if (!email.trim() || !password) return;

    setError("");
    setState("loading");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const text = await res.text();
      let data: { success?: boolean; error?: string } | null = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server cavabı JSON deyil:", text);
        setError("Serverdən gözlənilməz cavab. Konsolu yoxlayın.");
        setState("error");
        return;
      }

      if (!res.ok || !data?.success) {
        setAttempts((a) => a + 1);
        setError(data?.error || "Email və ya şifrə yanlışdır");
        setState("error");
        setTimeout(() => setState("idle"), 3000);
        return;
      }

      setState("success");
      setTimeout(() => {
        window.location.href = safeCallbackUrl;
      }, 800);
    } catch (err: any) {
      console.error("Fetch xətası:", err);
      setError("Şəbəkə xətası: " + (err.message || "Bilinməyən xəta"));
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const isLoading = state === "loading";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <BackgroundPattern />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div
              className={`
                w-[72px] h-[72px] rounded-2xl
                bg-gradient-to-br from-emerald-400 to-emerald-700
                flex items-center justify-center
                shadow-2xl shadow-emerald-900/50
                transition-transform duration-300
                ${isSuccess ? "scale-110" : ""}
              `}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-9 h-9 text-white" />
              ) : (
                <Leaf className="w-9 h-9 text-white" />
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl -z-10 scale-150" aria-hidden="true" />
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Organik Gədəbəy idarəetmə sistemi</p>
          </div>
        </div>

        {/* Kart */}
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/40">
          {/* Çoxlu cəhd xəbərdarlığı */}
          {attempts >= 3 && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3" role="alert">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-amber-300">
                Bir neçə uğursuz cəhd etdiniz. Şifrənizi unutmusunuzsa, sistem administratoru ilə əlaqə saxlayın.
              </p>
            </div>
          )}

          {/* Xəta banneri */}
          {isError && error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3" role="alert">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Uğur banneri */}
          {isSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3" role="status">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-emerald-300">Uğurla daxil oldunuz! Yönləndirilirsiniz...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <InputField
              label="Email ünvanı"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="admin@organikgedebey.az"
              icon={Mail}
              disabled={isLoading || isSuccess}
              autoComplete="username email"
            />

            <InputField
              label="Şifrə"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••••••"
              icon={Lock}
              disabled={isLoading || isSuccess}
              autoComplete="current-password"
              suffix={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={isLoading || isSuccess || !email.trim() || !password}
              className={`
                w-full py-4 rounded-xl font-bold text-sm
                flex items-center justify-center gap-2.5
                transition-all duration-300
                disabled:cursor-not-allowed
                ${
                  isSuccess
                    ? "bg-emerald-600 text-white"
                    : isError
                    ? "bg-red-600/80 text-white"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-900/40 active:scale-[0.98] disabled:opacity-50"
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Yoxlanılır...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Uğurlu!
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" aria-hidden="true" />
                  Daxil ol
                  <ArrowRight className="w-4 h-4 ml-auto" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-2 justify-center">
            <Shield className="w-3 h-3 text-slate-600" aria-hidden="true" />
            <p className="text-[11px] text-slate-600 text-center">
              Yalnız səlahiyyətli şəxslər üçündür. Bütün daxilolmalar qeydə alınır.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-700 mt-5">
          © {new Date().getFullYear()} Organik Gədəbəy. Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" aria-label="Yüklənir..." />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}