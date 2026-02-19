// app/(storefront)/login/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-store'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, Lock, Loader2, Eye, EyeOff, Leaf, Sparkles,
  ArrowRight, Shield, CheckCircle2, AlertCircle, Zap,
  User, Star, Clock, Phone, Chrome, Apple, Github,
  RefreshCw, Info, ChevronDown, Globe
} from 'lucide-react'

// ─── Organic SVG background (same style as forgot-password) ────────────────
const ORGANIC_SVG = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.06'%3E%3Cpath d='M50 50v-6h-3v6h-6v3h6v6h3v-6h6v-3h-6zm0-42V2h-3v6h-6v3h6v6h3V11h6V8h-6zM8 50v-6H5v6H-1v3h6v6h3v-6h6v-3H8zM8 8V2H5v6H-1v3h6v6h3V11h6V8H8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

const LEAF_POSITIONS = [
  { x: 8, delay: 0, dur: 22 }, { x: 20, delay: 4, dur: 18 },
  { x: 45, delay: 8, dur: 25 }, { x: 65, delay: 2, dur: 20 },
  { x: 80, delay: 12, dur: 16 }, { x: 92, delay: 6, dur: 23 },
]

// ─── Recent logins (mock localStorage simulation) ──────────────────────────
const RECENT_ACCOUNTS = [
  { email: 'customer@example.com', name: 'Test Müştəri', avatar: 'T' },
]

// ─── Social providers ──────────────────────────────────────────────────────
const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', icon: '🌐', color: '#ea4335' },
  { id: 'apple', label: 'Apple', icon: '🍎', color: '#000' },
  { id: 'phone', label: 'Telefon', icon: '📱', color: '#16a34a' },
]

export default function LoginPage() {
  const { login, isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()

  // ── Core state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // ── NEW functionality states
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [phone, setPhone] = useState('')
  const [phoneStep, setPhoneStep] = useState<'enter' | 'otp'>('enter')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(0)
  const [capsLock, setCapsLock] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [showQuickAccess, setShowQuickAccess] = useState(false)
  const [passwordStrengthVisible, setPasswordStrengthVisible] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [timeGreeting, setTimeGreeting] = useState('')

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const passwordRef = useRef<HTMLInputElement>(null)

  // ── 1. Time-based greeting
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 6) setTimeGreeting('Gecəniz xeyrə qalsın 🌙')
    else if (h < 12) setTimeGreeting('Sabahınız xeyir ☀️')
    else if (h < 17) setTimeGreeting('Günortanız xeyir 🌿')
    else if (h < 21) setTimeGreeting('Axşamınız xeyir 🌅')
    else setTimeGreeting('Gecəniz xeyir 🌙')
  }, [])

  // ── 2. Redirect if already authenticated
  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.replace('/account')
  }, [hasHydrated, isAuthenticated, router])

  // ── 3. OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(t => t - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [otpTimer])

  // ── 4. Caps Lock detection
  const handleKeyEvent = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'))
  }

  // ── 5. Account lock after 5 failed attempts
  const isLocked = lockedUntil && Date.now() < lockedUntil
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0

  useEffect(() => {
    if (isLocked) {
      const t = setTimeout(() => setLockedUntil(null), lockSecondsLeft * 1000)
      return () => clearTimeout(t)
    }
  }, [isLocked])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.replace('/account')
    } catch (err: any) {
      const attempts = loginAttempts + 1
      setLoginAttempts(attempts)
      if (attempts >= 5) {
        setLockedUntil(Date.now() + 30000) // 30 second lock
        setError('Çox sayda uğursuz cəhd. 30 saniyə gözləyin.')
        setLoginAttempts(0)
      } else {
        setError(`${err.message} (${5 - attempts} cəhd qalıb)`)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── 6. OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (!value && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const handleSendOtp = () => {
    setPhoneStep('otp')
    setOtpTimer(60)
  }

  // ── 7. Social login handler (mock)
  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider)
    await new Promise(r => setTimeout(r, 1500))
    setSocialLoading(null)
    setError(`${provider} girişi hazırda əlçatan deyil. Email ilə daxil olun.`)
  }

  // ── 8. Quick account switcher
  const quickLogin = (acc: typeof RECENT_ACCOUNTS[0]) => {
    setEmail(acc.email)
    setLoginMethod('email')
    passwordRef.current?.focus()
  }

  // ── 9. Demo fill
  const fillDemo = () => {
    setEmail('customer@example.com')
    setPassword('customer123')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50">

      {/* ── Organic pattern background ── */}
      <div className="absolute inset-0 opacity-100" style={{ backgroundImage: ORGANIC_SVG }} />

      {/* ── Soft gradient blobs ── */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, #86efac, transparent)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl translate-x-1/3 translate-y-1/3"
        style={{ background: 'radial-gradient(circle, #a7f3d0, transparent)' }} />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #bbf7d0, transparent)' }} />

      {/* ── Floating leaves ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {LEAF_POSITIONS.map((l, i) => (
          <motion.div key={i}
            initial={{ y: -80, x: `${l.x}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: '110vh', opacity: [0, 0.4, 0.4, 0], rotate: [0, 180, 360] }}
            transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'linear' }}
            className="absolute"
          >
            <Leaf className="w-5 h-5 text-emerald-400" />
          </motion.div>
        ))}
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >

          {/* ── Logo & greeting ── */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.15 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl mb-5 shadow-2xl shadow-emerald-500/30"
            >
              <span className="text-3xl">🌿</span>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-sm font-semibold text-emerald-600 mb-1">
              {timeGreeting}
            </motion.p>
            <h1 className="text-3xl font-black text-gray-900 mb-1">Organik Gədəbəy</h1>
            <p className="text-gray-500 text-sm">Hesabınıza daxil olun</p>
          </div>

          {/* ── 9. Quick account switcher ── */}
          <AnimatePresence>
            {RECENT_ACCOUNTS.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <button onClick={() => setShowQuickAccess(!showQuickAccess)}
                  className="w-full flex items-center justify-between p-3.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-black text-sm">
                      {RECENT_ACCOUNTS[0].avatar}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-800">{RECENT_ACCOUNTS[0].name}</div>
                      <div className="text-xs text-gray-500">{RECENT_ACCOUNTS[0].email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                    Sürətli giriş
                    <ChevronDown className={`w-4 h-4 transition-transform ${showQuickAccess ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {showQuickAccess && (
                    <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }} className="overflow-hidden">
                      <div className="pt-2 space-y-2">
                        {RECENT_ACCOUNTS.map((acc, i) => (
                          <button key={i} onClick={() => { quickLogin(acc); setShowQuickAccess(false) }}
                            className="w-full flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold text-xs">
                              {acc.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{acc.name}</div>
                              <div className="text-xs text-gray-500">{acc.email}</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-emerald-500 ml-auto" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/10 border border-emerald-100/80 p-7 sm:p-8"
          >

            {/* ── 3. Login method tabs ── */}
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
              {[
                { id: 'email', label: '📧 Email', },
                { id: 'phone', label: '📱 Telefon', },
              ].map(m => (
                <button key={m.id}
                  onClick={() => { setLoginMethod(m.id as any); setError('') }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: loginMethod === m.id ? 'white' : 'transparent',
                    color: loginMethod === m.id ? '#16a34a' : '#6b7280',
                    boxShadow: loginMethod === m.id ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* ── Error ── */}
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

            {/* ── Account locked banner ── */}
            <AnimatePresence>
              {isLocked && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mb-5 p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-orange-700">Hesab müvəqqəti kilidləndi</p>
                    <p className="text-xs text-orange-600">{lockSecondsLeft} saniyə sonra yenidən cəhd edin</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {loginMethod === 'email' ? (
                <motion.form key="email-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      Email ünvanı
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="sizin@email.com"
                        autoComplete="email"
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl
                                   focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                                   outline-none transition-all text-gray-900 placeholder-gray-400"
                      />
                      {email && email.includes('@') && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        Şifrə
                      </label>
                      <Link href="/forgot-password"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                        Unutmusunuz?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyEvent}
                        onKeyUp={handleKeyEvent}
                        required
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl
                                   focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                                   outline-none transition-all text-gray-900 pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* ── 4. Caps Lock warning ── */}
                    <AnimatePresence>
                      {capsLock && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-amber-600 text-xs font-medium pt-1">
                          <Info className="w-3.5 h-3.5" />
                          Böyük hərf kilidli (Caps Lock) aktivdir
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── Remember me ── */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => setRememberMe(!rememberMe)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                        ${rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white group-hover:border-emerald-400'}`}>
                      {rememberMe && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Məni yadda saxla</span>
                  </label>

                  {/* ── Submit ── */}
                  <motion.button type="submit"
                    disabled={loading || !!isLocked}
                    whileHover={{ scale: (loading || isLocked) ? 1 : 1.02 }}
                    whileTap={{ scale: (loading || isLocked) ? 1 : 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-green-600
                               text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30
                               transition-all flex items-center justify-center gap-2.5
                               disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Yüklənir...</>
                    ) : (
                      <><Zap className="w-5 h-5" /> Daxil ol</>
                    )}
                  </motion.button>

                  {/* ── 8. Demo quick fill ── */}
                  <button type="button" onClick={fillDemo}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Demo hesabla sınayın
                  </button>
                </motion.form>
              ) : (
                /* ── Phone / OTP login ── */
                <motion.div key="phone-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <AnimatePresence mode="wait">
                    {phoneStep === 'enter' ? (
                      <motion.div key="phone-enter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div>
                          <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            Telefon nömrəsi
                          </label>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1 px-3 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-700">
                              <Globe className="w-4 h-4 text-gray-400" />
                              +994
                            </div>
                            <input type="tel" value={phone}
                              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                              placeholder="50 000 00 00"
                              className="flex-1 px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                          </div>
                        </div>
                        <motion.button type="button"
                          disabled={phone.length < 9}
                          onClick={handleSendOtp}
                          whileHover={{ scale: phone.length < 9 ? 1 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                          <Phone className="w-5 h-5" />
                          OTP kodu göndər
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div key="otp-enter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                        <div className="text-center p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                          <p className="text-sm text-emerald-800 font-medium">
                            <span className="font-black">+994 {phone}</span> nömrəsinə kod göndərildi
                          </p>
                        </div>

                        {/* ── 5. OTP input boxes ── */}
                        <div>
                          <label className="text-sm font-bold text-gray-800 mb-3 block text-center">6 rəqəmli kodu daxil edin</label>
                          <div className="flex gap-2 justify-center">
                            {otp.map((digit, i) => (
                              <input key={i}
                                ref={el => { otpRefs.current[i] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => e.key === 'Backspace' && !digit && i > 0 && otpRefs.current[i-1]?.focus()}
                                className="w-11 h-12 text-center text-xl font-black bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {otpTimer > 0 ? `${otpTimer}s sonra yenidən göndər` : ''}
                          </span>
                          <button disabled={otpTimer > 0} onClick={() => { setOtpTimer(60) }}
                            className="font-semibold text-emerald-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1 hover:text-emerald-800 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Yenidən göndər
                          </button>
                        </div>

                        <motion.button
                          disabled={otp.join('').length < 6}
                          whileHover={{ scale: otp.join('').length < 6 ? 1 : 1.02 }}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Daxil ol
                        </motion.button>

                        <button onClick={() => setPhoneStep('enter')}
                          className="w-full text-center text-sm text-gray-500 hover:text-gray-800 transition-colors">
                          ← Nömrəni dəyişdir
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">və ya</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── 7. Social login ── */}
            <div className="grid grid-cols-3 gap-3">
              {SOCIAL_PROVIDERS.map(p => (
                <motion.button key={p.id}
                  type="button"
                  onClick={() => handleSocialLogin(p.label)}
                  disabled={!!socialLoading}
                  whileHover={{ scale: socialLoading ? 1 : 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 transition-all disabled:opacity-60"
                >
                  {socialLoading === p.label ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  ) : (
                    <span className="text-lg">{p.icon}</span>
                  )}
                  <span className="text-xs font-semibold text-gray-600">{p.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── Signup link ── */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Hesabınız yoxdur?{' '}
            <Link href="/signup" className="font-black text-emerald-600 hover:text-emerald-800 transition-colors">
              Qeydiyyatdan keçin →
            </Link>
          </p>

          {/* ── 10. Security badge ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit SSL şifrələnməsi ilə qorunur</span>
            <span>·</span>
            <Star className="w-3 h-3 text-amber-400" />
            <span>4.9/5 istifadəçi reytinqi</span>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}