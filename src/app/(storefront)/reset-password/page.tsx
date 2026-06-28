'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth-store'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { resetPassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Bərpa linki etibarsızdır')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-100 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Etibarsız link</h2>
        <p className="text-gray-600 mb-6">Şifrə bərpası linki düzgün deyil və ya vaxtı keçib.</p>
        <Link href="/forgot-password" className="text-blue-600 font-bold hover:text-blue-700">
          Yeni link tələb et
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100 p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Şifrə yeniləndi!</h2>
        <p className="text-gray-600 mb-6">Yeni şifrənizlə giriş edə bilərsiniz.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Giriş et
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Yeni şifrə
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Ən azı 8 simvol, 1 böyük hərf, 1 rəqəm"
            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Şifrəni təsdiqlə</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          {loading ? 'Yenilənir...' : 'Şifrəni yenilə'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Geri qayıt
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni şifrə təyin et</h1>
          <p className="text-gray-600">Hesabınız üçün güclü şifrə seçin</p>
        </div>

        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
