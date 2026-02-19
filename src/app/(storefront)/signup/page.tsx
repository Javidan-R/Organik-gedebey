// app/(storefront)/signup/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-store'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, Lock, User, Phone, Loader2, Eye, EyeOff, Leaf,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Sparkles,
  Shield, Star, ChevronRight, Globe, Info, Camera,
  Heart, Zap, RefreshCw, Check, X, Home, Clock,
  Instagram, Send, Facebook
} from 'lucide-react'

const ORGANIC_SVG = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.06'%3E%3Cpath d='M50 50v-6h-3v6h-6v3h6v6h3v-6h6v-3h-6zm0-42V2h-3v6h-6v3h6v6h3V11h6V8h-6zM8 50v-6H5v6H-1v3h6v6h3v-6h6v-3H8zM8 8V2H5v6H-1v3h6v6h3V11h6V8H8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

const LEAF_POSITIONS = [
  { x: 5, delay: 0, dur: 20 }, { x: 18, delay: 5, dur: 17 },
  { x: 38, delay: 9, dur: 24 }, { x: 58, delay: 2, dur: 19 },
  { x: 75, delay: 13, dur: 21 }, { x: 90, delay: 7, dur: 16 },
]

// ─── Step config ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Şəxsi', icon: '👤', desc: 'Adınız və telefon' },
  { id: 2, label: 'Hesab', icon: '🔐', desc: 'Email və şifrə' },
  { id: 3, label: 'Üstünlük', icon: '🌿', desc: 'Seçimlər' },
  { id: 4, label: 'Sosial', icon: '🔗', desc: 'Sosial şəbəkələr' },
]

// ─── Options ────────────────────────────────────────────────────────────────
const FRUITS = ['🍎 Alma', '🍋 Limon', '🍇 Üzüm', '🍓 Çiyələk', '🍑 Şaftalı', '🍐 Armud', '🍊 Portağal', '🫐 Gilas']
const VEGETABLES = ['🥕 Yerkökü', '🍅 Pomidor', '🥦 Brokkoli', '🥬 Ispanak', '🧅 Soğan', '🫑 Biber', '🥒 Xiyar', '🌽 Qarğıdalı']
const DIETARY = ['Vegetarian', 'Vegan', 'Gluten-free', 'Südsüz', 'Şəkərsiz', 'Üzvi']
const FREQUENCIES = [
  { value: 'daily', label: 'Hər gün', emoji: '⚡', desc: 'Yüksək aktivlik' },
  { value: 'weekly', label: 'Həftəlik', emoji: '📅', desc: 'Orta səviyyə' },
  { value: 'monthly', label: 'Aylıq', emoji: '🗓️', desc: 'Aşağı aktivlik' },
]

// ─── Password strength ───────────────────────────────────────────────────────
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

export default function SignupPage() {
  const { signup, isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(4)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Form data
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    // Preferences
    dietaryRestrictions: [] as string[],
    favoriteFruits: [] as string[],
    favoriteVegetables: [] as string[],
    shoppingFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    averageOrderSize: 'medium' as 'small' | 'medium' | 'large',
    // Social
    instagram: '',
    whatsapp: '',
    telegram: '',
    facebook: '',
    notifications: {
      orderUpdates: true,
      promotions: true,
      newProducts: true,
      newsletter: false,
    },
  })

  // Avatar color picker
  const AVATAR_COLORS = ['#16a34a', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])

  // Password strength
  const pwStrength = getPasswordStrength(form.password)

  // Redirect if auth
  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.replace('/account')
  }, [hasHydrated, isAuthenticated, router])

  // Countdown after success
  useEffect(() => {
    if (success && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    if (success && countdown === 0) {
      router.replace('/')
    }
  }, [success, countdown, router])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  // ── Step validation
  const canProceed = () => {
    if (step === 1) return form.name.trim().length >= 2 && form.phone.length >= 7
    if (step === 2) return form.email.includes('@') && form.password.length >= 6 && form.password === form.confirmPassword && agreedTerms
    if (step === 3) return true
    if (step === 4) return true
    return false
  }

  const handleNext = async () => {
    setError('')
    if (step < 4) {
      setStep(s => s + 1)
      return
    }
    // Final submit
    setLoading(true)
    try {
      await signup({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        preferences: {
          dietaryRestrictions: form.dietaryRestrictions,
          favoriteFruits: form.favoriteFruits.map(f => f.split(' ')[1]),
          favoriteVegetables: form.favoriteVegetables.map(v => v.split(' ')[1]),
          shoppingFrequency: form.shoppingFrequency,
          averageOrderSize: form.averageOrderSize,
          notifications: form.notifications,
        },
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
      if (err.message.includes('email')) setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const inputClass = `w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl
    focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
    outline-none transition-all text-gray-900 placeholder-gray-400`

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: ORGANIC_SVG }} />

        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div key={i}
            className="absolute text-2xl pointer-events-none"
            initial={{
              x: '50vw', y: '50vh',
              opacity: 1, scale: 0,
            }}
            animate={{
              x: `${10 + Math.random() * 80}vw`,
              y: `${10 + Math.random() * 80}vh`,
              opacity: [1, 1, 0],
              scale: [0, 1, 0.5],
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 2 + Math.random(), delay: i * 0.05 }}
          >
            {['🎉', '🌿', '⭐', '🍎', '✨', '🥳', '🌱', '💚', '🍋', '🥦'][i % 10]}
          </motion.div>
        ))}

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.7 }}
          className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 p-10 max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-400/40"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
          >
            <span className="text-5xl">🎉</span>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-3xl font-black text-gray-900 mb-2">
            Xoş gəldiniz!
          </motion.h2>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mb-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-3"
              style={{ background: avatarColor }}>
              {form.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-gray-700 font-semibold">
              Salam, <span className="text-emerald-600 font-black">{form.name.split(' ')[0]}</span>! 🌿
            </p>
            <p className="text-gray-500 text-sm mt-1">Hesabınız uğurla yaradıldı</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="my-5 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <Home className="w-4 h-4" />
              <span className="text-sm font-semibold">Ana səhifəyə yönləndirilirsiniz...</span>
            </div>
          </motion.div>

          {/* Countdown bar */}
          <motion.div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}
            />
          </motion.div>

          <p className="text-xs text-gray-400 mb-5">{countdown} saniyə sonra ana səhifə...</p>

          <Link href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
            <Home className="w-4 h-4" />
            İndi keç
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Organic pattern */}
      <div className="absolute inset-0" style={{ backgroundImage: ORGANIC_SVG }} />

      {/* Blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl translate-x-1/3 -translate-y-1/3"
        style={{ background: 'radial-gradient(circle, #86efac, transparent)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15 blur-3xl -translate-x-1/4 translate-y-1/4"
        style={{ background: 'radial-gradient(circle, #a7f3d0, transparent)' }} />

      {/* Floating leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {LEAF_POSITIONS.map((l, i) => (
          <motion.div key={i}
            initial={{ y: -80, x: `${l.x}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: '110vh', opacity: [0, 0.35, 0.35, 0], rotate: [0, 180, 360] }}
            transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'linear' }}
            className="absolute">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </motion.div>
        ))}
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

          {/* Back to login */}
          <Link href="/login">
            <motion.div whileHover={{ x: -4 }}
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Giriş səhifəsinə qayıt
            </motion.div>
          </Link>

          {/* Logo */}
          <div className="text-center mb-7">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-xl shadow-emerald-500/30">
              <span className="text-2xl">🌿</span>
            </motion.div>
            <h1 className="text-2xl font-black text-gray-900">Qeydiyyat</h1>
            <p className="text-gray-500 text-sm mt-1">Organik Gədəbəy ailəsinə qoşulun</p>
          </div>

          {/* ── Step progress ── */}
          <div className="flex items-center gap-1 mb-7">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      background: step > s.id ? '#16a34a' : step === s.id ? '#16a34a' : '#e5e7eb',
                      scale: step === s.id ? 1.1 : 1,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
                  >
                    {step > s.id ? <Check className="w-4 h-4" /> : s.icon}
                  </motion.div>
                  <span className="text-[10px] font-semibold mt-1 hidden sm:block"
                    style={{ color: step >= s.id ? '#16a34a' : '#9ca3af' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full transition-all duration-500"
                    style={{ background: step > s.id ? '#16a34a' : '#e5e7eb' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/10 border border-emerald-100/80 p-7 sm:p-8"
          >
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                  <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ════ STEP 1: Personal info ════ */}
              {step === 1 && (
                <motion.div key="s1"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Şəxsi məlumatlar</h2>
                    <p className="text-sm text-gray-500 mt-1">Ad-soyadınız və əlaqə nömrəsi</p>
                  </div>

                  {/* ── Avatar color picker (NEW 1) ── */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">Profil rəngi seçin</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg transition-all"
                        style={{ background: avatarColor }}>
                        {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {AVATAR_COLORS.map(c => (
                          <button key={c} onClick={() => setAvatarColor(c)}
                            className="w-8 h-8 rounded-xl transition-all border-2"
                            style={{ background: c, borderColor: avatarColor === c ? '#1f2937' : 'transparent', transform: avatarColor === c ? 'scale(1.15)' : 'scale(1)' }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      Ad Soyad
                    </label>
                    <input type="text" value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Əli Həsənov"
                      autoComplete="name"
                      className={inputClass} />
                    {/* ── Real-time name validation (NEW 2) ── */}
                    {form.name && form.name.trim().length < 2 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Ən azı 2 hərf lazımdır
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Telefon nömrəsi
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 px-3 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 flex-shrink-0">
                        <Globe className="w-4 h-4 text-gray-400" />
                        +994
                      </div>
                      <input type="tel" value={form.phone}
                        onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="50 000 00 00"
                        className={`${inputClass} flex-1`} />
                    </div>
                  </div>

                  {/* ── Short bio (NEW 3) ── */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-2 block">
                      Qısa bio <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                    </label>
                    <textarea value={form.bio}
                      onChange={e => update('bio', e.target.value.slice(0, 100))}
                      placeholder="Özünüz haqqında qısa məlumat..."
                      rows={2}
                      className={`${inputClass} resize-none`} />
                    <p className="text-xs text-gray-400 text-right mt-1">{form.bio.length}/100</p>
                  </div>

                  {/* Order size preference (NEW 4) */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-3 block">Ümumi sifariş həcmi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'small', label: 'Kiçik', emoji: '🛍️', desc: '1-3 məhsul' },
                        { val: 'medium', label: 'Orta', emoji: '🛒', desc: '4-8 məhsul' },
                        { val: 'large', label: 'Böyük', emoji: '📦', desc: '8+ məhsul' },
                      ].map(o => (
                        <button key={o.val} type="button"
                          onClick={() => update('averageOrderSize', o.val)}
                          className="p-3 rounded-2xl text-center border-2 transition-all"
                          style={{
                            borderColor: form.averageOrderSize === o.val ? '#16a34a' : '#e5e7eb',
                            background: form.averageOrderSize === o.val ? '#f0fdf4' : '#f9fafb',
                          }}>
                          <div className="text-xl mb-1">{o.emoji}</div>
                          <div className="text-xs font-bold" style={{ color: form.averageOrderSize === o.val ? '#16a34a' : '#374151' }}>{o.label}</div>
                          <div className="text-[10px] text-gray-400">{o.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════ STEP 2: Credentials ════ */}
              {step === 2 && (
                <motion.div key="s2"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Giriş məlumatları</h2>
                    <p className="text-sm text-gray-500 mt-1">Email ünvanı və güvənli şifrə</p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      Email ünvanı
                    </label>
                    <div className="relative">
                      <input type="email" value={form.email}
                        onChange={e => update('email', e.target.value)}
                        placeholder="sizin@email.com"
                        autoComplete="email"
                        className={inputClass} />
                      {form.email.includes('@') && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Şifrə
                    </label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password}
                        onChange={e => update('password', e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`${inputClass} pr-12`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* ── 5. Live password strength meter ── */}
                    <AnimatePresence>
                      {form.password && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                style={{ background: i <= pwStrength.score ? pwStrength.color : '#e5e7eb' }} />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: pwStrength.color }} className="font-semibold">{pwStrength.label}</span>
                            <span className="text-gray-400">{form.password.length} hərf</span>
                          </div>
                          {/* ── 6. Password requirements checklist ── */}
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {[
                              { test: form.password.length >= 8, label: '8+ hərf' },
                              { test: /[A-Z]/.test(form.password), label: 'Böyük hərf' },
                              { test: /[0-9]/.test(form.password), label: 'Rəqəm' },
                              { test: /[^A-Za-z0-9]/.test(form.password), label: 'Xüsusi işarə' },
                            ].map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${r.test ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                  {r.test && <Check className="w-2 h-2 text-white" />}
                                </div>
                                <span className={r.test ? 'text-emerald-600 font-medium' : 'text-gray-400'}>{r.label}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Şifrəni təsdiqləyin
                    </label>
                    <div className="relative">
                      <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                        onChange={e => update('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pr-12`}
                        style={{
                          borderColor: form.confirmPassword && form.confirmPassword !== form.password
                            ? '#ef4444' : form.confirmPassword && form.confirmPassword === form.password
                            ? '#16a34a' : '#e5e7eb',
                        }} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.password && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <X className="w-3 h-3" /> Şifrələr uyğun gəlmir
                      </p>
                    )}
                    {form.confirmPassword && form.confirmPassword === form.password && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Şifrələr uyğundur
                      </p>
                    )}
                  </div>

                  {/* ── 7. Terms checkbox ── */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div onClick={() => setAgreedTerms(!agreedTerms)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                        ${agreedTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                      {agreedTerms && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">
                      <Link href="/terms" className="font-bold text-emerald-600 hover:text-emerald-800">İstifadə şərtlərini</Link> və{' '}
                      <Link href="/privacy" className="font-bold text-emerald-600 hover:text-emerald-800">Gizlilik siyasətini</Link> oxudum və qəbul edirəm
                    </span>
                  </label>
                </motion.div>
              )}

              {/* ════ STEP 3: Preferences ════ */}
              {step === 3 && (
                <motion.div key="s3"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Üstünlükləriniz 🌿</h2>
                    <p className="text-sm text-gray-500 mt-1">Sizə uyğun tövsiyələr üçün</p>
                  </div>

                  {/* Shopping frequency */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-3 block">Alış-veriş tezliyi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FREQUENCIES.map(f => (
                        <button key={f.value} type="button"
                          onClick={() => update('shoppingFrequency', f.value)}
                          className="p-3 rounded-2xl text-center border-2 transition-all"
                          style={{
                            borderColor: form.shoppingFrequency === f.value ? '#16a34a' : '#e5e7eb',
                            background: form.shoppingFrequency === f.value ? '#f0fdf4' : '#f9fafb',
                          }}>
                          <div className="text-2xl mb-1">{f.emoji}</div>
                          <div className="text-xs font-bold" style={{ color: form.shoppingFrequency === f.value ? '#16a34a' : '#374151' }}>{f.label}</div>
                          <div className="text-[10px] text-gray-400">{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-2 block">Qida məhdudiyyətləri</label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY.map(d => {
                        const active = form.dietaryRestrictions.includes(d)
                        return (
                          <button key={d} type="button"
                            onClick={() => update('dietaryRestrictions', toggle(form.dietaryRestrictions, d))}
                            className="px-3 py-1.5 rounded-xl text-xs border-2 font-semibold transition-all"
                            style={{
                              borderColor: active ? '#16a34a' : '#e5e7eb',
                              background: active ? '#f0fdf4' : '#f9fafb',
                              color: active ? '#16a34a' : '#6b7280',
                            }}>
                            {active ? '✓ ' : ''}{d}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Fruits */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-2 block">Sevimli meyvələr</label>
                    <div className="flex flex-wrap gap-2">
                      {FRUITS.map(f => {
                        const active = form.favoriteFruits.includes(f)
                        return (
                          <button key={f} type="button"
                            onClick={() => update('favoriteFruits', toggle(form.favoriteFruits, f))}
                            className="px-3 py-1.5 rounded-xl text-xs border-2 transition-all"
                            style={{
                              borderColor: active ? '#16a34a' : '#e5e7eb',
                              background: active ? '#f0fdf4' : '#f9fafb',
                              color: active ? '#15803d' : '#6b7280',
                              fontWeight: active ? '700' : '500',
                            }}>
                            {f}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Vegetables */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-2 block">Sevimli tərəvəzlər</label>
                    <div className="flex flex-wrap gap-2">
                      {VEGETABLES.map(v => {
                        const active = form.favoriteVegetables.includes(v)
                        return (
                          <button key={v} type="button"
                            onClick={() => update('favoriteVegetables', toggle(form.favoriteVegetables, v))}
                            className="px-3 py-1.5 rounded-xl text-xs border-2 transition-all"
                            style={{
                              borderColor: active ? '#16a34a' : '#e5e7eb',
                              background: active ? '#f0fdf4' : '#f9fafb',
                              color: active ? '#15803d' : '#6b7280',
                              fontWeight: active ? '700' : '500',
                            }}>
                            {v}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-3 block">Bildiriş tənzimləmələri</label>
                    <div className="space-y-2">
                      {[
                        { key: 'orderUpdates', label: '📦 Sifariş yeniləmələri' },
                        { key: 'promotions', label: '🎁 Kampaniyalar və endirimlər' },
                        { key: 'newProducts', label: '🌱 Yeni məhsullar' },
                        { key: 'newsletter', label: '📰 Həftəlik xəbər bülleteni' },
                      ].map(n => {
                        const checked = (form.notifications as any)[n.key]
                        return (
                          <label key={n.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                            <span className="text-sm text-gray-700">{n.label}</span>
                            <div onClick={() => update('notifications', { ...form.notifications, [n.key]: !checked })}
                              className={`w-10 h-5.5 rounded-full relative cursor-pointer transition-all p-0.5 flex items-center ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
                              style={{ width: '40px', height: '22px' }}>
                              <motion.div animate={{ x: checked ? 18 : 0 }}
                                className="w-4 h-4 bg-white rounded-full shadow" />
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center">Bu addım isteğe bağlıdır — sonradan dəyişə bilərsiniz</p>
                </motion.div>
              )}

              {/* ════ STEP 4: Social networks (NEW 8) ════ */}
              {step === 4 && (
                <motion.div key="s4"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Sosial şəbəkələr 🔗</h2>
                    <p className="text-sm text-gray-500 mt-1">İsteğə bağlı — icmamızla əlaqə saxlayın</p>
                  </div>

                  <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Sosial şəbəkə məlumatlarınız digər istifadəçilərə göstərilməyəcək.
                        Yalnız xüsusi kampaniyalar üçün istifadə edilə bilər.
                      </p>
                    </div>
                  </div>

                  {[
                    { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@istifadeci_adi' },
                    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: '+994 50 000 00 00' },
                    { key: 'telegram', label: 'Telegram', icon: '✈️', placeholder: '@telegram_adi' },
                    { key: 'facebook', label: 'Facebook', icon: '👤', placeholder: 'profil linki' },
                  ].map(s => (
                    <div key={s.key}>
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                        <span className="text-base">{s.icon}</span>
                        {s.label}
                        <span className="text-xs text-gray-400 font-normal">(isteğe bağlı)</span>
                      </label>
                      <input type="text"
                        value={(form as any)[s.key]}
                        onChange={e => update(s.key, e.target.value)}
                        placeholder={s.placeholder}
                        className={inputClass} />
                    </div>
                  ))}

                  {/* ── 10. Summary preview before submit ── */}
                  <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                    <p className="text-xs font-bold text-gray-700 mb-3">📋 Hesab xülasəsi</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Ad', val: form.name },
                        { label: 'Email', val: form.email },
                        { label: 'Telefon', val: form.phone ? `+994 ${form.phone}` : '—' },
                        { label: 'Tezlik', val: FREQUENCIES.find(f => f.value === form.shoppingFrequency)?.label },
                        { label: 'Meyvələr', val: form.favoriteFruits.length ? `${form.favoriteFruits.length} seçilib` : 'Heç biri' },
                        { label: 'Tərəvəzlər', val: form.favoriteVegetables.length ? `${form.favoriteVegetables.length} seçilib` : 'Heç biri' },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{r.label}</span>
                          <span className="font-semibold text-gray-800 truncate max-w-[60%] text-right">{r.val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* ── Navigation buttons ── */}
            <div className="flex gap-3 mt-7">
              {step > 1 && (
                <motion.button type="button" onClick={() => setStep(s => s - 1)}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </motion.button>
              )}

              <motion.button type="button"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                whileHover={{ scale: (!canProceed() || loading) ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-green-600
                           text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30
                           transition-all flex items-center justify-center gap-2.5
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Yaradılır...</>
                ) : step < 4 ? (
                  <>İrəli <ArrowRight className="w-5 h-5" /></>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Hesab yarat</>
                )}
              </motion.button>
            </div>

            {/* Step skip for optional steps */}
            {step >= 3 && (
              <button type="button" onClick={step === 4 ? handleNext : () => setStep(4)}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors">
                Bu addımı keç →
              </button>
            )}
          </motion.div>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Artıq hesabınız var?{' '}
            <Link href="/login" className="font-black text-emerald-600 hover:text-emerald-800 transition-colors">
              Daxil olun
            </Link>
          </p>

          {/* Security note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Məlumatlarınız şifrələnmiş şəkildə saxlanılır</span>
          </div>

        </motion.div>
      </div>
    </div>
  )
}