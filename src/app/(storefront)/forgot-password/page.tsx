// app/(storefront)/forgot-password/page.tsx
'use client'
 
import { useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Mail, Loader2,  ArrowLeft, CheckCircle2, Shield, 
  Clock, Leaf, AlertCircle
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Organic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000) }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
              rotate: 360,
              opacity: [0, 0.3, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, delay: i * 5 }}
            className="absolute"
          >
            <Leaf className="w-6 h-6 text-blue-400" />
          </motion.div>
        ))}
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <Link href="/login">
            <motion.div
              whileHover={{ x: -4 }}
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri qayıt
            </motion.div>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl shadow-blue-500/50"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Şifrəni unutmusunuz?
            </h1>
            <p className="text-lg text-gray-600">
              Narahat olmayın, biz sizə kömək edəcəyik
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 p-8"
              >
                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {/* Info */}
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                  <p className="text-sm text-blue-800">
                    Email ünvanınızı daxil edin və biz sizə şifrəni sıfırlamaq üçün link göndərəcəyik.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Email ünvanınız
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="sizin@email.com"
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl 
                               focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100
                               outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 
                             text-white font-bold rounded-xl shadow-xl shadow-blue-500/50 
                             transition-all flex items-center justify-center gap-2 
                             disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Göndərilir...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>Bərpa linki göndər</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100 p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-xl shadow-green-500/50"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Email göndərildi!
                </h2>
                <p className="text-gray-600 mb-2">
                  Şifrəni bərpa etmək üçün link{' '}
                  <span className="font-bold text-gray-900">{email}</span> ünvanına göndərildi.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Email gəlmədiyi halda spam qovluğunuzu yoxlayın.
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-4 h-4" />
                  <span>Link 1 saat ərzində etibarlıdır</span>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Giriş səhifəsinə qayıt
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Link */}
          {!success && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Hələ də problem var?{' '}
              <Link
                href="/support"
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Dəstək alın
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}