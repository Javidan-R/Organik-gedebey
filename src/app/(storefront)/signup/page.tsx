// app/(storefront)/signup/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail, Lock, User, Phone, Loader2, Eye, EyeOff,
  ArrowRight, CheckCircle2, AlertCircle, Sparkles,
  ChevronRight, Check, X, Star, Package
} from 'lucide-react'

const getPasswordStrength = (pwd: string) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (pwd.length >= 12) score++
  const labels = ['', 'Çox zəif', 'Zəif', 'Orta', 'Güclü', 'Çox güclü']
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']
  return { score, label: labels[score] || '', color: colors[score] || '' }
}

const passwordRequirements = [
  { id: 'length', label: 'Ən azı 8 hərf', test: (pwd: string) => pwd.length >= 8 },
  { id: 'uppercase', label: 'Böyük hərf', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'number', label: 'Rəqəm', test: (pwd: string) => /[0-9]/.test(pwd) },
  { id: 'special', label: 'Xüsusi işarə', test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
]

interface ProductItem {
  id: string
  name: string
  price: number
  image?: string
  // başqa sahələr…
}

export default function SignupPage() {
  const { signup, isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/account'

  // Real məhsulları API‑dən çəkək
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?limit=3')
      .then(res => res.json())
      .then(data => {
        // API cavab formasına görə düzəliş edə bilərsiniz
        const list = data.products || data || []
        setFeaturedProducts(list.slice(0, 3))
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false))
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const pwStrength = getPasswordStrength(form.password)

  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.replace(callbackUrl)
  }, [hasHydrated, isAuthenticated, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Ad ən azı 2 hərf olmalıdır')
      return
    }
    if (form.phone.length < 9) {
      setError('Telefon nömrəsi düzgün deyil')
      return
    }
    if (!form.email.includes('@')) {
      setError('Email düzgün deyil')
      return
    }
    if (form.password.length < 8) {
      setError('Şifrə ən azı 8 hərf olmalıdır')
      return
    }
    if (pwStrength.score < 3) {
      setError('Şifrə çox zəifdir. Daha güclü şifrə seçin')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Şifrələr uyğun gəlmir')
      return
    }
    if (!agreedTerms) {
      setError('İstifadə şərtlərini qəbul etməlisiniz')
      return
    }

    setLoading(true)
    try {
      const nameParts = form.name.trim().split(' ')
      await signup({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: form.phone,
        email: form.email,
        password: form.password,
      })
      setSuccess(true)
      setTimeout(() => router.replace(callbackUrl), 1500)
    } catch (err: any) {
      setError(err.message || 'Qeydiyyat uğursuz oldu')
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const inputClass = `w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl
    focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
    outline-none transition-all text-gray-900 placeholder-gray-400`

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl border border-emerald-100 p-10 max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Hesab yaradıldı!</h2>
          <p className="text-gray-600">Organik Gədəbəy ailəsinə xoş gəldiniz</p>
        </motion.div>
      </div>
    )
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
          <Link href="/login" className="px-4 py-2 border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors">
            Daxil ol
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left Column - Signup Form */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Giriş səhifəsinə qayıt
            </Link>

            <div className="text-center mb-6 sm:mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-xl">
                <span className="text-xl sm:text-2xl">🌿</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">Qeydiyyat</h1>
              <p className="text-gray-500 text-sm mt-1">Organik Gədəbəy ailəsinə qoşulun</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-emerald-100 p-5 sm:p-8"
            >
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* … inputlar (dəyişməyib) */}
                {/* Ad Soyad */}
                <div>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Ad Soyad
                  </label>
                  <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Əli Həsənov" autoComplete="name" className={inputClass} required />
                </div>

                {/* Telefon */}
                <div>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Telefon
                  </label>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1 px-3 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 flex-shrink-0">+994</div>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="50 000 00 00" className={`${inputClass} flex-1 min-w-[120px]`} required />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Email
                  </label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="sizin@email.com" autoComplete="email" className={inputClass} required />
                </div>

                {/* Şifrə */}
                <div>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Şifrə
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" className={`${inputClass} pr-12`} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= pwStrength.score ? pwStrength.color : '#e5e7eb' }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span style={{ color: pwStrength.color }} className="font-semibold">{pwStrength.label}</span>
                        <span className="text-gray-400">{form.password.length} hərf</span>
                      </div>
                      <div className="space-y-2">
                        {passwordRequirements.map(req => {
                          const passed = req.test(form.password)
                          return (
                            <div key={req.id} className="flex items-center gap-2 text-xs">
                              {passed ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                              <span className={passed ? 'text-emerald-600' : 'text-gray-400'}>{req.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Şifrə təsdiqi */}
                <div>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Şifrə təsdiqi
                  </label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="••••••••" className={`${inputClass} pr-12`} style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#ef4444' : form.confirmPassword && form.confirmPassword === form.password ? '#16a34a' : '#e5e7eb' }} required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* İstifadə şərtləri */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div onClick={() => setAgreedTerms(!agreedTerms)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreedTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {agreedTerms && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-600">
                    <Link href="/terms" className="font-bold text-emerald-600 hover:text-emerald-800">İstifadə şərtlərini</Link> və{' '}
                    <Link href="/privacy" className="font-bold text-emerald-600 hover:text-emerald-800">Gizlilik siyasətini</Link> qəbul edirəm
                  </span>
                </label>

                <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Hesab yarat
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Artıq hesabınız var?{' '}
                <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-black text-emerald-600 hover:text-emerald-800">
                  Daxil olun
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Right Column - Real Products from API */}
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
                <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
                  Məhsullara bax <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-6">
              <h3 className="text-xl font-black text-slate-800 mb-4">Populyar Məhsullar</h3>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : featuredProducts.length > 0 ? (
                <div className="space-y-4">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl hover:from-emerald-100 hover:to-green-100 transition-all cursor-pointer group">
                      <div className="flex-1">
                        <div className="font-bold text-slate-800">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-slate-600">4.9</span> {/* sabit reytinq, ya da product.rating */}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">₼{Number(product.price).toFixed(2)}</div>
                        <div className="text-xs text-slate-400">kq</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Hələ məhsul yoxdur</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}