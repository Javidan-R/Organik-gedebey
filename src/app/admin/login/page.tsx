'use client'

// app/admin/login/page.tsx
// NextAuth-dan asılılıq yoxdur — custom /api/auth/admin-login endpoint-i işlənir.
// Middleware og_admin='ok' cookie-ni yoxlayır, bu endpoint həmin cookie-ni yaradır.

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, Zap, Mail, Lock,
  Eye, EyeOff, Loader2, Leaf, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // Artıq giriş varsa yönləndir
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user?.role?.toLowerCase().includes('admin')) {
          router.replace(nextPath)
        }
      })
      .catch(() => {})
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email daxil edin'); return }
    if (!password)     { setError('Şifrə daxil edin'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Giriş uğursuz oldu')
        setLoading(false)
        return
      }

      setSuccess(true)
      // Qısa animasiyadan sonra yönləndir
      setTimeout(() => router.replace(nextPath), 900)
    } catch {
      setError('Şəbəkə xətası. Yenidən cəhd edin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950
      flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
          bg-emerald-500/3 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
              bg-gradient-to-br from-emerald-500 to-emerald-700
              shadow-xl shadow-emerald-500/30 mb-2"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Panel</h1>
          <p className="text-slate-400 text-sm">Yalnız səlahiyyətli şəxslər üçündür</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl
          border border-white/[0.08] shadow-2xl overflow-hidden">

          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          <div className="p-8 space-y-6">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10
                    border border-red-500/20 rounded-2xl"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-emerald-500/10
                    border border-emerald-500/20 rounded-2xl"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-emerald-400 font-medium">Uğurlu giriş! Yönləndirilir...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Mail className="w-3.5 h-3.5" />Email
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    required
                    disabled={loading || success}
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                      text-white placeholder-slate-500 text-sm
                      focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500/50
                      outline-none transition-all disabled:opacity-50"
                    placeholder="admin@organikgedebey.az"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Lock className="w-3.5 h-3.5" />Şifrə
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    disabled={loading || success}
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl
                      text-white placeholder-slate-500 text-sm
                      focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500/50
                      outline-none transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    disabled={loading || success}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2
                      text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  >
                    {showPwd
                      ? <EyeOff className="w-4.5 h-4.5" />
                      : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || success}
                whileHover={{ scale: loading || success ? 1 : 1.02 }}
                whileTap={{ scale: loading || success ? 1 : 0.98 }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600
                  text-white font-black text-sm rounded-xl
                  shadow-lg shadow-emerald-500/25
                  flex items-center justify-center gap-2.5
                  disabled:opacity-60 disabled:cursor-not-allowed
                  hover:from-emerald-400 hover:to-emerald-500
                  transition-all duration-200"
              >
                {success ? (
                  <><CheckCircle className="w-4.5 h-4.5" />Daxil olundu</>
                ) : loading ? (
                  <><Loader2 className="w-4.5 h-4.5 animate-spin" />Yoxlanır...</>
                ) : (
                  <><Zap className="w-4.5 h-4.5" />Daxil ol</>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <Link href="/"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5">
                <Leaf className="w-3 h-3" />Ana səhifə
              </Link>
              <p className="text-[10px] text-slate-600">
                v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0'}
              </p>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        {/* Dev hint — sadəcə development-də görünür */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl"
          >
            <p className="text-xs font-black text-amber-400 mb-2">🔧 Dev mode credentials</p>
            <div className="space-y-1 font-mono text-[11px] text-amber-300/80">
              <p>email: admin@organikgedebey.az</p>
              <p>password: Admin123!</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}