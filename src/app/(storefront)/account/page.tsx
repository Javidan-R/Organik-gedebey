// app/(storefront)/account/page.tsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/lib/auth-store'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User, Settings, MapPin, Bell, Heart, ShoppingBag, LogOut,
  Edit3, Plus, Trash2, Check, X, Star, Package, ChevronRight,
  Shield, Award, Leaf, Clock, Phone, Mail, Gift, TrendingUp,
  Home, Briefcase, ToggleLeft, ToggleRight, Save, AlertCircle,
  CheckCircle2, Copy, Share2, Download, Camera, Sparkles,
  Instagram, Send, Globe, Facebook, ChevronDown, ChevronUp,
  Zap, Target, ShoppingCart, RefreshCw, Eye, BarChart2,
  Sun, Moon, MessageCircle, Lock, ArrowRight, Info,
  Percent, Tag, Wallet, Users, Flame
} from 'lucide-react'
import type { Address } from '@/lib/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'preferences' | 'notifications' | 'loyalty' | 'security' | 'social' | 'analytics'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDERS = [
  { id: 'ORD-2401', date: '2024-01-15', status: 'delivered', total: 47.50, items: ['🍎 Alma 2kg', '🍅 Pomidor 1kg', '🍇 Üzüm 500g'], rating: 5 },
  { id: 'ORD-2402', date: '2024-01-22', status: 'delivered', total: 32.00, items: ['🥕 Yerkökü 1kg', '🥬 Ispanak 500g'], rating: 4 },
  { id: 'ORD-2403', date: '2024-02-01', status: 'processing', total: 61.25, items: ['🍋 Limon 1kg', '🍐 Armud 2kg', '🫑 Biber 500g'], rating: null },
  { id: 'ORD-2404', date: '2024-02-10', status: 'shipped', total: 28.75, items: ['🍑 Şaftalı 1kg', '🍓 Çiyələk 250g'], rating: null },
]

const MOCK_WISHLIST = [
  { id: 'w1', name: 'Üzvi Bal 500g', price: 18.00, emoji: '🍯', inStock: true, category: 'Bal məhsulları' },
  { id: 'w2', name: 'Dağ Çayı 100g', price: 8.50, emoji: '🌿', inStock: true, category: 'Çaylar' },
  { id: 'w3', name: 'Qoz 1kg', price: 22.00, emoji: '🪨', inStock: false, category: 'Quru meyvə' },
  { id: 'w4', name: 'Gilas 500g', price: 12.00, emoji: '🫐', inStock: true, category: 'Meyvə' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; step: number }> = {
  processing: { label: 'Hazırlanır', color: '#f59e0b', bg: '#fef3c7', icon: '⏳', step: 1 },
  shipped: { label: 'Yolda', color: '#3b82f6', bg: '#dbeafe', icon: '🚚', step: 2 },
  delivered: { label: 'Çatdırıldı', color: '#10b981', bg: '#d1fae5', icon: '✅', step: 3 },
  cancelled: { label: 'Ləğv edildi', color: '#ef4444', bg: '#fee2e2', icon: '❌', step: 0 },
}

const LOYALTY_LEVELS = [
  { level: 'Yaşıl', minPoints: 0, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', emoji: '🌱', perks: ['5% endirim', 'Pulsuz çatdırılma (₼50+)', 'Doğum günü hədiyyəsi'] },
  { level: 'Gümüş', minPoints: 500, color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', emoji: '🥈', perks: ['8% endirim', 'Pulsuz çatdırılma (₼30+)', 'Erkən giriş', 'Xüsusi endirimlər'] },
  { level: 'Qızıl', minPoints: 1500, color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '🥇', perks: ['12% endirim', 'Pulsuz çatdırılma', 'VIP dəstək', 'Hədiyyə paketi'] },
  { level: 'Platin', minPoints: 5000, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', emoji: '💎', perks: ['18% endirim', 'Aylıq hədiyyə qutusu', 'Şəxsi menecer', 'Beta məhsullar'] },
]

const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number; mobile?: boolean }[] = [
  { id: 'overview', label: 'Ümumi', icon: <User className="w-4 h-4" />, mobile: true },
  { id: 'orders', label: 'Sifarişlər', icon: <ShoppingBag className="w-4 h-4" />, badge: 2, mobile: true },
  { id: 'wishlist', label: 'İstəklər', icon: <Heart className="w-4 h-4" />, badge: 4, mobile: true },
  { id: 'addresses', label: 'Ünvanlar', icon: <MapPin className="w-4 h-4" />, mobile: true },
  { id: 'preferences', label: 'Üstünlüklər', icon: <Leaf className="w-4 h-4" /> },
  { id: 'notifications', label: 'Bildirişlər', icon: <Bell className="w-4 h-4" /> },
  { id: 'social', label: 'Sosial', icon: <Users className="w-4 h-4" /> },
  { id: 'analytics', label: 'Statistika', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'loyalty', label: 'Loyallıq', icon: <Award className="w-4 h-4" /> },
  { id: 'security', label: 'Təhlükəsizlik', icon: <Shield className="w-4 h-4" /> },
]

// ─── Recommendation Engine ─────────────────────────────────────────────────────
function getRecommendations(user: any, orders: typeof MOCK_ORDERS) {
  const fruits = user?.preferences?.favoriteFruits || []
  const vegs = user?.preferences?.favoriteVegetables || []
  const dietary = user?.preferences?.dietaryRestrictions || []

  const all = [
    { id: 'r1', name: 'Üzvi Bal', emoji: '🍯', price: 18, reason: 'Populyar seçim', tag: 'bestseller', score: 95 },
    { id: 'r2', name: 'Təzə Limon', emoji: '🍋', price: 4.5, reason: fruits.includes('limon') ? 'Sevimli meyvəniz' : 'Yeni məhsul', tag: fruits.includes('limon') ? 'fav' : 'new', score: fruits.includes('limon') ? 98 : 72 },
    { id: 'r3', name: 'Dağ Çayı', emoji: '🌿', price: 8.5, reason: dietary.includes('Vegetarian') ? 'Vegetarian seçim' : 'Sağlamlıq üçün', tag: 'healthy', score: 88 },
    { id: 'r4', name: 'Qaymaq', emoji: '🥛', price: 6, reason: 'Sifarişinizə uyğun', tag: 'match', score: 85 },
    { id: 'r5', name: 'Üzvi Pomidor', emoji: '🍅', price: 3.5, reason: vegs.includes('pomidor') ? 'Sevimli tərəvəziniz' : 'Çox sifariş verilən', tag: vegs.includes('pomidor') ? 'fav' : 'popular', score: vegs.includes('pomidor') ? 97 : 80 },
    { id: 'r6', name: 'Alma Sirkəsi', emoji: '🍶', price: 7, reason: 'Həftənin məhsulu', tag: 'weekly', score: 75 },
    { id: 'r7', name: 'Taze İspanaq', emoji: '🥬', price: 2.5, reason: dietary.includes('Vegan') ? 'Vegan seçim' : 'Sağlamlıq üçün', tag: dietary.includes('Vegan') ? 'vegan' : 'healthy', score: dietary.includes('Vegan') ? 94 : 70 },
    { id: 'r8', name: 'Qoz', emoji: '🪨', price: 22, reason: 'Enerji mənbəyi', tag: 'energy', score: 78 },
  ]

  return all.sort((a, b) => b.score - a.score).slice(0, 6)
}

const TAG_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  bestseller: { label: '🔥 Bestseller', color: '#dc2626', bg: '#fee2e2' },
  fav: { label: '❤️ Sevimlim', color: '#be185d', bg: '#fce7f3' },
  new: { label: '✨ Yeni', color: '#1d4ed8', bg: '#dbeafe' },
  healthy: { label: '🌿 Sağlam', color: '#15803d', bg: '#dcfce7' },
  match: { label: '🎯 Uyğun', color: '#7c3aed', bg: '#ede9fe' },
  popular: { label: '⭐ Populyar', color: '#d97706', bg: '#fef3c7' },
  vegan: { label: '🌱 Vegan', color: '#15803d', bg: '#dcfce7' },
  weekly: { label: '📅 Həftəlik', color: '#0369a1', bg: '#e0f2fe' },
  energy: { label: '⚡ Enerji', color: '#b45309', bg: '#fef3c7' },
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const show = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }
  return { toast, show }
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 transition-all"
      style={{ width: 44, height: 24 }}>
      <div className="absolute inset-0 rounded-full transition-all"
        style={{ background: checked ? '#16a34a' : '#d1d5db' }} />
      <motion.div animate={{ x: checked ? 20 : 2 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
    </button>
  )
}

// ─── Rating stars ─────────────────────────────────────────────────────────────
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, updateProfile, updatePreferences, addAddress, updateAddress, deleteAddress, logout, hasHydrated, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast, show: showToast } = useToast()

  const [tab, setTab] = useState<Tab>('overview')
  const [mobileTabOpen, setMobileTabOpen] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [addingAddress, setAddingAddress] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: '', fullAddress: '', city: 'Bakı', district: '', phone: '', type: 'home' as Address['type'], isDefault: false })
  const [wishlist, setWishlist] = useState(MOCK_WISHLIST)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orderRatings, setOrderRatings] = useState<Record<string, number>>({})
  const [ratingHover, setRatingHover] = useState<Record<string, number>>({})
  const [copiedRef, setCopiedRef] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [socialForm, setSocialForm] = useState({ instagram: '', telegram: '', whatsapp: '', facebook: '' })
  const [editingSocial, setEditingSocial] = useState(false)
  const [addToCart, setAddToCart] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [wishlistSearch, setWishlistSearch] = useState('')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.replace('/login')
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone })
  }, [user])

  const loyaltyPoints = useMemo(() =>
    MOCK_ORDERS.filter(o => o.status === 'delivered').reduce((s, o) => s + Math.floor(o.total * 10), 0),
  [])

  const currentLevel = useMemo(() =>
    LOYALTY_LEVELS.slice().reverse().find(l => loyaltyPoints >= l.minPoints) || LOYALTY_LEVELS[0],
  [loyaltyPoints])

  const nextLevel = useMemo(() =>
    LOYALTY_LEVELS.find(l => l.minPoints > loyaltyPoints),
  [loyaltyPoints])

  const progressPct = nextLevel
    ? (loyaltyPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints) * 100
    : 100

  const totalSpent = MOCK_ORDERS.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const referralCode = `OG-${(user?.id || '').slice(-6).toUpperCase()}`

  const recommendations = useMemo(() => getRecommendations(user, MOCK_ORDERS), [user])

  const filteredOrders = orderFilter === 'all'
    ? MOCK_ORDERS
    : MOCK_ORDERS.filter(o => o.status === orderFilter)

  const filteredWishlist = wishlistSearch
    ? wishlist.filter(w => w.name.toLowerCase().includes(wishlistSearch.toLowerCase()))
    : wishlist

  const handleSaveProfile = () => {
    updateProfile(profileForm)
    setEditProfile(false)
    showToast('Profil yeniləndi ✓')
  }

  const handleAddAddress = () => {
    if (!newAddr.label || !newAddr.fullAddress) return
    addAddress(newAddr)
    setAddingAddress(false)
    setNewAddr({ label: '', fullAddress: '', city: 'Bakı', district: '', phone: '', type: 'home', isDefault: false })
    showToast('Ünvan əlavə edildi ✓')
  }

  const handleRateOrder = (orderId: string, rating: number) => {
    setOrderRatings(r => ({ ...r, [orderId]: rating }))
    showToast(`${rating}⭐ qiymət verildi!`)
  }

  const copyRef = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {})
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
    showToast('Referans kodu kopyalandı!')
  }

  const handleAddToCart = (id: string) => {
    setAddToCart(id)
    setTimeout(() => setAddToCart(null), 1500)
    showToast('Səbətə əlavə edildi 🛒')
  }

  const saveSocial = () => {
    setEditingSocial(false)
    showToast('Sosial şəbəkələr yadda saxlandı ✓')
  }

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 1.2, repeat: Infinity, ease: 'linear' }, scale: { duration: 1, repeat: Infinity } }}>
          <span className="text-4xl">🌿</span>
        </motion.div>
      </div>
    )
  }

  // ── Input styles
  const inp = "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-gray-900 text-sm placeholder-gray-400"

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-green-50/40">

      {/* Organic bg */}
      <div className="fixed inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.04'%3E%3Cpath d='M50 50v-6h-3v6h-6v3h6v6h3v-6h6v-3h-6zm0-42V2h-3v6h-6v3h6v6h3V11h6V8h-6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -60, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[100] px-5 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-2xl border"
            style={{
              background: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#0ea5e9',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8">

        {/* ── TOP HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">🌿</div>
            <span className="hidden sm:block font-black text-gray-800">Organik Gədəbəy</span>
          </Link>
          <div className="flex items-center gap-2">
           
            <motion.button onClick={() => { logout(); router.push('/') }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-semibold shadow-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıxış</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── PROFILE HERO CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 p-6 sm:p-8 mb-6 overflow-hidden">

          {/* Decorative gradient */}
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${currentLevel.bg}, transparent 60%)` }} />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/3 blur-2xl"
            style={{ background: currentLevel.color }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <motion.div whileHover={{ scale: 1.05 }} className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${currentLevel.color}, #22c55e)` }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center"
                style={{ background: currentLevel.color }}>
                <span className="text-xs">{currentLevel.emoji}</span>
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{user.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold border"
                  style={{ borderColor: currentLevel.border, color: currentLevel.color, background: currentLevel.bg }}>
                  {currentLevel.emoji} {currentLevel.level} üzv
                </span>
              </div>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Üzv olma tarixi: {new Date(user.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              {/* Loyalty mini progress */}
              {nextLevel && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{loyaltyPoints} puan</span>
                    <span>{nextLevel.level} üçün {nextLevel.minPoints - loyaltyPoints} puan</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${currentLevel.color}, #22c55e)` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 sm:grid-cols-2 gap-3 w-full sm:w-auto">
              {[
                { emoji: '📦', val: MOCK_ORDERS.length, label: 'Sifariş' },
                { emoji: '⭐', val: loyaltyPoints, label: 'Puan' },
                { emoji: '❤️', val: wishlist.length, label: 'İstək' },
                { emoji: '💰', val: `₼${totalSpent.toFixed(0)}`, label: 'Xərcləndi' },
              ].map((s, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }}
                  className="text-center p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-all cursor-default">
                  <div className="text-lg">{s.emoji}</div>
                  <div className="text-base font-black text-gray-900">{s.val}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── MOBILE TAB SELECTOR ── */}
        <div className="lg:hidden mb-4">
          <button onClick={() => setMobileTabOpen(!mobileTabOpen)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm font-semibold text-gray-800">
            <span className="flex items-center gap-2">
              {ALL_TABS.find(t => t.id === tab)?.icon}
              {ALL_TABS.find(t => t.id === tab)?.label}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${mobileTabOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {mobileTabOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1 bg-white rounded-2xl border border-gray-200 shadow-sm">
                {ALL_TABS.map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setMobileTabOpen(false) }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-all border-b border-gray-50 last:border-none text-left">
                    <span className="flex items-center gap-3 text-sm"
                      style={{ color: tab === t.id ? '#16a34a' : '#6b7280', fontWeight: tab === t.id ? '700' : '500' }}>
                      {t.icon} {t.label}
                    </span>
                    {t.badge && <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold bg-emerald-500 text-white">{t.badge}</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-6">

          {/* ── SIDEBAR ── */}
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="hidden lg:flex flex-col w-56 flex-shrink-0 gap-1">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3">
              {ALL_TABS.map(t => (
                <motion.button key={t.id} onClick={() => setTab(t.id)} whileHover={{ x: 3 }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all text-left mb-0.5"
                  style={{
                    background: tab === t.id ? '#f0fdf4' : 'transparent',
                    color: tab === t.id ? '#16a34a' : '#6b7280',
                    fontWeight: tab === t.id ? '700' : '500',
                  }}>
                  <span className="flex items-center gap-2.5 text-sm">{t.icon} {t.label}</span>
                  {t.badge && (
                    <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                      style={{ background: tab === t.id ? '#16a34a' : '#e5e7eb', color: tab === t.id ? 'white' : '#6b7280' }}>
                      {t.badge}
                    </span>
                  )}
                </motion.button>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              <button onClick={() => { logout(); router.push('/') }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4" />
                Çıxış et
              </button>
            </div>
          </motion.aside>

          {/* ── CONTENT ── */}
          <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="flex-1 min-w-0">

            <AnimatePresence mode="wait">

              {/* ══════════════════════════════════════════════
                  OVERVIEW
              ══════════════════════════════════════════════ */}
              {tab === 'overview' && (
                <motion.div key="overview"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-5">

                  {/* Quick actions */}
                  <div>
                    <h2 className="text-lg font-black text-gray-900 mb-3">Sürətli əməliyyatlar</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { emoji: '🛒', label: 'Alış-veriş et', href: '/products', color: '#16a34a' },
                        { emoji: '📦', label: 'Sifarişlər', action: () => setTab('orders'), color: '#3b82f6' },
                        { emoji: '🎁', label: 'Hədiyyə al', href: '/baskets', color: '#d97706' },
                        { emoji: '⭐', label: 'Loyallıq', action: () => setTab('loyalty'), color: '#7c3aed' },
                      ].map((a, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                          {a.href ? (
                            <Link href={a.href} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all text-center group">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                                style={{ background: `${a.color}15` }}>{a.emoji}</div>
                              <span className="text-xs font-bold text-gray-700">{a.label}</span>
                            </Link>
                          ) : (
                            <button onClick={a.action} className="w-full flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all text-center group">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                                style={{ background: `${a.color}15` }}>{a.emoji}</div>
                              <span className="text-xs font-bold text-gray-700">{a.label}</span>
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── AI RECOMMENDATIONS (NEW 2) ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-black text-gray-900">Sizin üçün tövsiyələr</h2>
                      </div>
                      <Link href="/products" className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 flex items-center gap-1">
                        Hamısı <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Seçimlərinizə və sifariş tarixçənizə görə hazırlanıb
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {recommendations.map((rec, i) => {
                        const tagStyle = TAG_STYLES[rec.tag] || TAG_STYLES.popular
                        const inCart = addToCart === rec.id
                        return (
                          <motion.div key={rec.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.07 }}
                            whileHover={{ y: -3 }}
                            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">{rec.emoji}</div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: tagStyle.bg, color: tagStyle.color }}>
                                {tagStyle.label}
                              </span>
                            </div>
                            <div className="font-bold text-gray-800 text-sm mb-0.5">{rec.name}</div>
                            <div className="text-xs text-gray-400 mb-1">{rec.reason}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-black text-emerald-600">₼{rec.price.toFixed(2)}</span>
                              <motion.button
                                onClick={() => handleAddToCart(rec.id)}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-xl transition-all"
                                style={{ background: inCart ? '#16a34a' : '#f0fdf4' }}>
                                {inCart
                                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                                  : <ShoppingCart className="w-4 h-4 text-emerald-600" />}
                              </motion.button>
                            </div>
                            {/* Match score bar */}
                            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${rec.score}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }} />
                            </div>
                            <div className="text-right text-xs text-gray-400 mt-0.5">{rec.score}% uyğun</div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Profile info card */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-black text-gray-900">Profil məlumatları</h2>
                      <button onClick={() => setEditProfile(!editProfile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all">
                        <Edit3 className="w-3.5 h-3.5" />
                        {editProfile ? 'Ləğv et' : 'Düzəliş'}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {editProfile ? (
                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ad Soyad</label>
                            <input type="text" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Telefon</label>
                            <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className={inp} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveProfile}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/20">
                              <Save className="w-4 h-4" /> Saxla
                            </button>
                            <button onClick={() => setEditProfile(false)}
                              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                              Ləğv et
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="grid sm:grid-cols-2 gap-3">
                          {[
                            { label: 'Ad Soyad', value: user.name, icon: <User className="w-4 h-4" /> },
                            { label: 'Email', value: user.email, icon: <Mail className="w-4 h-4" /> },
                            { label: 'Telefon', value: user.phone || 'Əlavə edilməyib', icon: <Phone className="w-4 h-4" /> },
                            { label: 'Rol', value: user.role === 'customer' ? '🌿 Müştəri' : user.role, icon: <Shield className="w-4 h-4" /> },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="text-emerald-500">{item.icon}</span>
                              <div>
                                <div className="text-xs text-gray-400">{item.label}</div>
                                <div className="font-semibold text-sm text-gray-800">{item.value}</div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Recent orders preview */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-black text-gray-900">Son sifarişlər</h2>
                      <button onClick={() => setTab('orders')} className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 flex items-center gap-1">
                        Hamısı <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {MOCK_ORDERS.slice(0, 2).map(o => {
                        const s = STATUS_CONFIG[o.status]
                        return (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-emerald-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>{s.icon}</div>
                              <div>
                                <div className="font-bold text-sm text-gray-800">{o.id}</div>
                                <div className="text-xs text-gray-400">{new Date(o.date).toLocaleDateString('az-AZ')}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-gray-900">₼{o.total.toFixed(2)}</div>
                              <div className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  ORDERS
              ══════════════════════════════════════════════ */}
              {tab === 'orders' && (
                <motion.div key="orders"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900">Sifarişlərim</h2>
                    <span className="text-sm text-gray-500">{filteredOrders.length} sifariş</span>
                  </div>

                  {/* ── Order filter tabs (NEW 3) ── */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { id: 'all', label: 'Hamısı' },
                      { id: 'processing', label: '⏳ Hazırlanır' },
                      { id: 'shipped', label: '🚚 Yolda' },
                      { id: 'delivered', label: '✅ Çatdırıldı' },
                    ].map(f => (
                      <button key={f.id} onClick={() => setOrderFilter(f.id)}
                        className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex-shrink-0"
                        style={{
                          background: orderFilter === f.id ? '#f0fdf4' : 'white',
                          borderColor: orderFilter === f.id ? '#16a34a' : '#e5e7eb',
                          color: orderFilter === f.id ? '#16a34a' : '#6b7280',
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Bu kateqoriyada sifariş yoxdur</p>
                    </div>
                  )}

                  {filteredOrders.map((order, i) => {
                    const s = STATUS_CONFIG[order.status]
                    const isOpen = expandedOrder === order.id
                    const userRating = orderRatings[order.id] || order.rating
                    return (
                      <motion.div key={order.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <button onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: s.bg }}>{s.icon}</div>
                            <div>
                              <div className="font-black text-gray-900">{order.id}</div>
                              <div className="text-sm text-gray-400">{new Date(order.date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                              {userRating && <Stars rating={userRating} />}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <div className="font-black text-lg text-gray-900">₼{order.total.toFixed(2)}</div>
                              <div className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
                              <div className="p-5 space-y-4">
                                {/* Mobile price */}
                                <div className="sm:hidden flex justify-between">
                                  <span className="font-black text-lg">₼{order.total.toFixed(2)}</span>
                                  <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                                </div>

                                {/* Order tracking steps (NEW 4) */}
                                {order.status !== 'cancelled' && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sifariş izlənməsi</p>
                                    <div className="flex items-center gap-2">
                                      {[
                                        { step: 1, label: 'Qəbul edildi', icon: '📋' },
                                        { step: 2, label: 'Yolda', icon: '🚚' },
                                        { step: 3, label: 'Çatdırıldı', icon: '🏠' },
                                      ].map((st, j) => (
                                        <div key={j} className="flex items-center flex-1">
                                          <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
                                              ${s.step >= st.step ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                                              {s.step >= st.step
                                                ? <Check className="w-4 h-4 text-white" />
                                                : <span className="text-gray-400 text-xs">{st.icon}</span>}
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">{st.label}</span>
                                          </div>
                                          {j < 2 && <div className="flex-1 h-0.5 mb-4 mx-1 rounded-full"
                                            style={{ background: s.step > st.step ? '#16a34a' : '#e5e7eb' }} />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Items */}
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Məhsullar</p>
                                  {order.items.map((item, j) => (
                                    <div key={j} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-none text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span className="text-gray-700">{item}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* ── Rating system (NEW 5) ── */}
                                {order.status === 'delivered' && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Sifariş qiymətləndirilməsi</p>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <motion.button key={star}
                                          whileTap={{ scale: 1.3 }}
                                          onClick={() => handleRateOrder(order.id, star)}
                                          onMouseEnter={() => setRatingHover(h => ({ ...h, [order.id]: star }))}
                                          onMouseLeave={() => setRatingHover(h => ({ ...h, [order.id]: 0 }))}
                                          className="transition-transform">
                                          <Star className={`w-6 h-6 transition-all
                                            ${(ratingHover[order.id] || userRating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                        </motion.button>
                                      ))}
                                      {userRating && <span className="text-xs text-gray-500 ml-2 self-center">{userRating}/5 qiymət verdiniz</span>}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                    <Package className="w-3.5 h-3.5" /> Yenidən sifariş
                                  </button>
                                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                    <Download className="w-3.5 h-3.5" /> Qəbz
                                  </button>
                                  {order.status === 'delivered' && (
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                      <MessageCircle className="w-3.5 h-3.5" /> Rəy yaz
                                    </button>
                                  )}
                                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                    <Share2 className="w-3.5 h-3.5" /> Paylaş
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  WISHLIST
              ══════════════════════════════════════════════ */}
              {tab === 'wishlist' && (
                <motion.div key="wishlist"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900">İstək siyahısı ({wishlist.length})</h2>
                  </div>

                  {/* ── Search within wishlist (NEW 6) ── */}
                  <div className="relative">
                    <input type="text" value={wishlistSearch}
                      onChange={e => setWishlistSearch(e.target.value)}
                      placeholder="İstək siyahısında axtar..."
                      className={inp} />
                    {wishlistSearch && (
                      <button onClick={() => setWishlistSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {filteredWishlist.map((item, i) => (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                        layout
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-emerald-200 hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl flex-shrink-0">{item.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 truncate">{item.name}</div>
                          <div className="text-xs text-gray-400 mb-1">{item.category}</div>
                          <div className="font-black text-emerald-600">₼{item.price.toFixed(2)}</div>
                          {!item.inStock && <div className="text-xs text-red-500 font-medium mt-0.5">⚠️ Stokda yoxdur</div>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <motion.button
                            onClick={() => item.inStock && handleAddToCart(item.id)}
                            disabled={!item.inStock}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-xl transition-all disabled:opacity-40"
                            style={{ background: item.inStock ? '#f0fdf4' : '#f3f4f6' }}>
                            {addToCart === item.id
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              : <ShoppingCart className="w-4 h-4 text-emerald-600" />}
                          </motion.button>
                          <motion.button
                            onClick={() => { setWishlist(w => w.filter(x => x.id !== item.id)); showToast('Siyahıdan çıxarıldı') }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filteredWishlist.length === 0 && (
                    <div className="text-center py-16">
                      <Heart className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-400 font-medium">{wishlistSearch ? 'Nəticə tapılmadı' : 'İstək siyahınız boşdur'}</p>
                      {!wishlistSearch && (
                        <Link href="/products" className="mt-3 inline-block text-emerald-600 font-bold hover:text-emerald-800 transition-colors">
                          Məhsullara bax →
                        </Link>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  ADDRESSES
              ══════════════════════════════════════════════ */}
              {tab === 'addresses' && (
                <motion.div key="addresses"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900">Ünvanlarım</h2>
                    <button onClick={() => setAddingAddress(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/20">
                      <Plus className="w-4 h-4" /> Ünvan əlavə et
                    </button>
                  </div>

                  <AnimatePresence>
                    {addingAddress && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-white rounded-3xl border border-emerald-200 p-6 space-y-4 shadow-sm">
                          <h3 className="font-black text-gray-900">Yeni ünvan əlavə et</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ünvan adı</label>
                              <input type="text" value={newAddr.label} onChange={e => setNewAddr(a => ({ ...a, label: e.target.value }))} placeholder="Ev, İş..." className={inp} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Telefon</label>
                              <input type="tel" value={newAddr.phone} onChange={e => setNewAddr(a => ({ ...a, phone: e.target.value }))} placeholder="+994 50 000 00 00" className={inp} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Rayon</label>
                              <input type="text" value={newAddr.district} onChange={e => setNewAddr(a => ({ ...a, district: e.target.value }))} placeholder="Nəsimi" className={inp} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Növ</label>
                              <select value={newAddr.type} onChange={e => setNewAddr(a => ({ ...a, type: e.target.value as any }))}
                                className={`${inp} cursor-pointer`}>
                                <option value="home">🏠 Ev</option>
                                <option value="work">💼 İş</option>
                                <option value="other">📍 Digər</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tam ünvan</label>
                            <input type="text" value={newAddr.fullAddress} onChange={e => setNewAddr(a => ({ ...a, fullAddress: e.target.value }))} placeholder="Küçə, ev nömrəsi..." className={inp} />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newAddr.isDefault} onChange={e => setNewAddr(a => ({ ...a, isDefault: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                            <span className="text-sm text-gray-700 font-medium">Əsas ünvan kimi təyin et</span>
                          </label>
                          <div className="flex gap-3">
                            <button onClick={handleAddAddress}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600">
                              <Check className="w-4 h-4" /> Əlavə et
                            </button>
                            <button onClick={() => setAddingAddress(false)}
                              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                              Ləğv et
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {(!user.addresses || user.addresses.length === 0) && !addingAddress && (
                    <div className="text-center py-16">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-400 font-medium">Ünvan əlavə edilməyib</p>
                    </div>
                  )}

                  {(user.addresses || []).map((addr, i) => (
                    <motion.div key={addr.id}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-white rounded-2xl border shadow-sm p-5 flex items-start justify-between gap-4"
                      style={{ borderColor: addr.isDefault ? '#bbf7d0' : '#f3f4f6' }}>
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">
                          {addr.type === 'home' ? '🏠' : addr.type === 'work' ? '💼' : '📍'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-900">{addr.label}</span>
                            {addr.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">✓ Əsas</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{addr.fullAddress}</p>
                          <p className="text-xs text-gray-400">{addr.city}{addr.district ? `, ${addr.district}` : ''}</p>
                          {addr.phone && <p className="text-xs text-gray-400">{addr.phone}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => { updateAddress(addr.id, { isDefault: true }); showToast('Əsas ünvan dəyişdirildi ✓') }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all">
                            Əsas et
                          </button>
                        )}
                        <button onClick={() => { deleteAddress(addr.id); showToast('Ünvan silindi') }}
                          className="p-1.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  PREFERENCES
              ══════════════════════════════════════════════ */}
              {tab === 'preferences' && (
                <motion.div key="preferences"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-5">
                  <h2 className="text-xl font-black text-gray-900">Üstünlüklərim</h2>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                    {/* Frequency */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Alış-veriş tezliyi</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[{ v: 'daily', l: '⚡ Hər gün' }, { v: 'weekly', l: '📅 Həftəlik' }, { v: 'monthly', l: '🗓️ Aylıq' }].map(f => (
                          <button key={f.v}
                            onClick={() => { updatePreferences({ shoppingFrequency: f.v as any }); showToast('Saxlandı ✓') }}
                            className="p-3 rounded-2xl text-sm font-semibold border-2 transition-all"
                            style={{
                              borderColor: user.preferences?.shoppingFrequency === f.v ? '#16a34a' : '#e5e7eb',
                              background: user.preferences?.shoppingFrequency === f.v ? '#f0fdf4' : '#f9fafb',
                              color: user.preferences?.shoppingFrequency === f.v ? '#16a34a' : '#6b7280',
                            }}>
                            {f.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dietary */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Qida məhdudiyyətləri</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Vegetarian', 'Vegan', 'Gluten-free', 'Südsüz', 'Şəkərsiz', 'Üzvi'].map(d => {
                          const active = (user.preferences?.dietaryRestrictions || []).includes(d)
                          return (
                            <button key={d}
                              onClick={() => {
                                const cur = user.preferences?.dietaryRestrictions || []
                                updatePreferences({ dietaryRestrictions: active ? cur.filter(x => x !== d) : [...cur, d] })
                                showToast('Saxlandı ✓')
                              }}
                              className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
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

                    {/* Favorite fruits */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Sevimli meyvələr</h3>
                      <div className="flex flex-wrap gap-2">
                        {['alma', 'limon', 'uzum', 'ciyələk', 'şaftalı', 'armud', 'portağal'].map(f => {
                          const active = (user.preferences?.favoriteFruits || []).includes(f)
                          return (
                            <button key={f}
                              onClick={() => {
                                const cur = user.preferences?.favoriteFruits || []
                                updatePreferences({ favoriteFruits: active ? cur.filter(x => x !== f) : [...cur, f] })
                                showToast('Saxlandı ✓')
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs border-2 transition-all capitalize"
                              style={{
                                borderColor: active ? '#16a34a' : '#e5e7eb',
                                background: active ? '#f0fdf4' : '#f9fafb',
                                color: active ? '#16a34a' : '#6b7280',
                                fontWeight: active ? '700' : '500',
                              }}>
                              {active ? '✓ ' : ''}{f}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  NOTIFICATIONS
              ══════════════════════════════════════════════ */}
              {tab === 'notifications' && (
                <motion.div key="notifications"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <h2 className="text-xl font-black text-gray-900">Bildiriş tənzimləmələri</h2>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-3">
                    {[
                      { k: 'orderUpdates', l: '📦 Sifariş yeniləmələri', d: 'Sifarişinizin statusu dəyişdikdə' },
                      { k: 'promotions', l: '🎁 Kampaniyalar', d: 'Endirimlər və xüsusi təkliflər' },
                      { k: 'newProducts', l: '🌱 Yeni məhsullar', d: 'Yeni məhsullar əlavə edildiyi vaxt' },
                      { k: 'newsletter', l: '📰 Xəbər bülleteni', d: 'Həftəlik email bildirişlər' },
                    ].map(n => {
                      const checked = !!(user.preferences?.notifications as any)?.[n.k]
                      return (
                        <div key={n.k} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-emerald-50 transition-colors">
                          <div className="flex-1 mr-4">
                            <div className="font-semibold text-gray-900 text-sm">{n.l}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{n.d}</div>
                          </div>
                          <Toggle checked={checked}
                            onChange={v => {
                              const cur = user.preferences?.notifications || { orderUpdates: true, promotions: true, newProducts: true, newsletter: false }
                              updatePreferences({ notifications: { ...cur, [n.k]: v } })
                              showToast('Saxlandı ✓')
                            }} />
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  SOCIAL NETWORKS (NEW 7)
              ══════════════════════════════════════════════ */}
              {tab === 'social' && (
                <motion.div key="social"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900">Sosial şəbəkələr</h2>
                    <button onClick={() => setEditingSocial(!editingSocial)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                      {editingSocial ? 'Ləğv et' : 'Düzəliş et'}
                    </button>
                  </div>

                  <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-emerald-800">Sosial şəbəkə məlumatlarınız şəxsidir və üçüncü tərəflərlə paylaşılmır.</p>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    {[
                      { k: 'instagram', icon: '📸', label: 'Instagram', placeholder: '@istifadeci_adi', color: '#e1306c' },
                      { k: 'whatsapp', icon: '💬', label: 'WhatsApp', placeholder: '+994 50 000 00 00', color: '#25d366' },
                      { k: 'telegram', icon: '✈️', label: 'Telegram', placeholder: '@telegram_adi', color: '#0088cc' },
                      { k: 'facebook', icon: '👤', label: 'Facebook', placeholder: 'facebook.com/profil', color: '#1877f2' },
                    ].map(s => (
                      <div key={s.k} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${s.color}15` }}>{s.icon}</div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 mb-1">{s.label}</div>
                          {editingSocial ? (
                            <input type="text"
                              value={(socialForm as any)[s.k]}
                              onChange={e => setSocialForm(f => ({ ...f, [s.k]: e.target.value }))}
                              placeholder={s.placeholder}
                              className={inp} />
                          ) : (
                            <div className="text-sm font-medium"
                              style={{ color: (socialForm as any)[s.k] ? '#374151' : '#9ca3af' }}>
                              {(socialForm as any)[s.k] || 'Əlavə edilməyib'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {editingSocial && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={saveSocial}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600">
                          <Save className="w-4 h-4" /> Saxla
                        </button>
                        <button onClick={() => setEditingSocial(false)}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                          Ləğv et
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  ANALYTICS (NEW 8)
              ══════════════════════════════════════════════ */}
              {tab === 'analytics' && (
                <motion.div key="analytics"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <h2 className="text-xl font-black text-gray-900">Alış-veriş statistikası</h2>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { emoji: '💰', val: `₼${totalSpent.toFixed(2)}`, label: 'Ümumi xərc', color: '#16a34a' },
                      { emoji: '📦', val: MOCK_ORDERS.length, label: 'Sifariş sayı', color: '#3b82f6' },
                      { emoji: '📊', val: `₼${(totalSpent / MOCK_ORDERS.filter(o => o.status === 'delivered').length || 0).toFixed(2)}`, label: 'Ortalama', color: '#d97706' },
                      { emoji: '⭐', val: loyaltyPoints, label: 'Qazanılan puan', color: '#7c3aed' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                        <div className="text-2xl mb-2">{s.emoji}</div>
                        <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Category breakdown */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-black text-gray-900 mb-4">Kateqoriya üzrə xərc</h3>
                    {[
                      { label: 'Meyvə', pct: 45, color: '#16a34a', emoji: '🍎' },
                      { label: 'Tərəvəz', pct: 30, color: '#22c55e', emoji: '🥦' },
                      { label: 'Digər', pct: 25, color: '#86efac', emoji: '🌿' },
                    ].map((cat, i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-semibold text-gray-700">{cat.emoji} {cat.label}</span>
                          <span className="font-black" style={{ color: cat.color }}>{cat.pct}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className="h-full rounded-full" style={{ background: cat.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly chart (simple bars) */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-black text-gray-900 mb-4">Son 6 ayın xərci</h3>
                    <div className="flex items-end justify-between gap-2 h-32">
                      {[
                        { m: 'Avq', v: 22 }, { m: 'Sen', v: 38 }, { m: 'Okt', v: 15 },
                        { m: 'Noy', v: 47 }, { m: 'Dek', v: 32 }, { m: 'Yan', v: 61 },
                      ].map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-xs font-bold text-gray-600">₼{d.v}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(d.v / 61) * 100}%` }}
                            transition={{ duration: 0.7, delay: i * 0.1 }}
                            className="w-full rounded-t-xl"
                            style={{ background: 'linear-gradient(180deg, #16a34a, #22c55e)' }} />
                          <span className="text-[10px] text-gray-400">{d.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  LOYALTY
              ══════════════════════════════════════════════ */}
              {tab === 'loyalty' && (
                <motion.div key="loyalty"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-5">
                  <h2 className="text-xl font-black text-gray-900">Loyallıq Proqramı</h2>

                  {/* Points hero */}
                  <div className="bg-white rounded-3xl border shadow-xl p-6 relative overflow-hidden"
                    style={{ borderColor: currentLevel.border }}>
                    <div className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(135deg, ${currentLevel.bg}, transparent)` }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-4xl font-black" style={{ color: currentLevel.color }}>{loyaltyPoints}</div>
                          <div className="text-gray-500 text-sm">loyallıq puanı</div>
                        </div>
                        <div className="text-4xl">{currentLevel.emoji}</div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm mb-4"
                        style={{ background: currentLevel.bg, color: currentLevel.color, border: `2px solid ${currentLevel.border}` }}>
                        {currentLevel.emoji} {currentLevel.level} Üzv
                      </div>
                      {nextLevel && (
                        <>
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>{currentLevel.level}</span>
                            <span>{nextLevel.minPoints - loyaltyPoints} puan → {nextLevel.level}</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 1.2 }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${currentLevel.color}, #22c55e)` }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Referral (NEW 9) */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-black text-gray-900 mb-1">Dost dəvət et, puan qazanın</h3>
                    <p className="text-sm text-gray-500 mb-4">Hər uğurlu dəvət üçün 50 loyallıq puanı qazanırsınız</p>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 rounded-2xl font-mono font-black text-emerald-600 text-center border-2 border-emerald-200 bg-emerald-50 text-lg tracking-widest">
                        {referralCode}
                      </div>
                      <motion.button onClick={copyRef} whileTap={{ scale: 0.9 }}
                        className="p-3 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                        {copiedRef ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        className="p-3 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                        <Share2 className="w-5 h-5 text-gray-500" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Level cards */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {LOYALTY_LEVELS.map((level, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-2xl p-5 border-2 shadow-sm transition-all"
                        style={{
                          borderColor: currentLevel.level === level.level ? level.color : '#f3f4f6',
                          background: currentLevel.level === level.level ? level.bg : 'white',
                        }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{level.emoji}</span>
                            <span className="font-black text-gray-900">{level.level}</span>
                          </div>
                          <span className="text-xs text-gray-400">{level.minPoints}+ puan</span>
                        </div>
                        <div className="space-y-1.5">
                          {level.perks.map((perk, j) => (
                            <div key={j} className="flex items-center gap-2 text-sm">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: level.color }}>
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className="text-gray-600">{perk}</span>
                            </div>
                          ))}
                        </div>
                        {currentLevel.level === level.level && (
                          <div className="mt-3 text-xs font-bold px-3 py-1 rounded-full w-fit"
                            style={{ background: `${level.color}20`, color: level.color }}>
                            ✓ Hazırkı səviyyəniz
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════
                  SECURITY (NEW 10)
              ══════════════════════════════════════════════ */}
              {tab === 'security' && (
                <motion.div key="security"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">
                  <h2 className="text-xl font-black text-gray-900">Təhlükəsizlik</h2>

                  {/* Security score */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-gray-900">Təhlükəsizlik balı</h3>
                      <div className="text-2xl font-black text-emerald-600">72/100</div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: '72%' }}
                        transition={{ duration: 1.2 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #f59e0b, #16a34a)' }} />
                    </div>
                    <p className="text-xs text-gray-500">Hesabınızın təhlükəsizliyini artırmaq üçün 2FA aktivləşdirin</p>
                  </div>

                  {/* 2FA setup */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">İki mərhələli doğrulama</div>
                          <div className="text-xs text-gray-400">Hesabınızı ekstra qoruma ilə təmin edin</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                        Aktivləşdir
                      </button>
                    </div>
                  </div>

                  {/* Password change */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Şifrəni dəyiş</h3>
                    <Link href="/forgot-password"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-emerald-300 transition-all">
                      <Mail className="w-4 h-4" />
                      Şifrə sıfırlama linki göndər
                    </Link>
                  </div>

                  {/* Active sessions */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Aktiv sessiyalar</h3>
                    {[
                      { d: 'Chrome / Windows', l: 'Bakı, AZ', t: 'İndi', cur: true },
                      { d: 'Safari / iPhone 15', l: 'Bakı, AZ', t: '2 gün əvvəl', cur: false },
                      { d: 'Firefox / MacOS', l: 'Bakı, AZ', t: '5 gün əvvəl', cur: false },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl mb-2 last:mb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.cur ? '#16a34a' : '#d1d5db' }} />
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{s.d}</div>
                            <div className="text-xs text-gray-400">{s.l} · {s.t}</div>
                          </div>
                        </div>
                        {s.cur
                          ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktiv</span>
                          : <button className="text-xs text-red-500 font-semibold hover:underline">Çıxart</button>}
                      </div>
                    ))}
                  </div>

                  {/* Danger zone */}
                  <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-6">
                    <h3 className="font-bold text-red-600 mb-2">⚠️ Təhlükəli zona</h3>
                    <p className="text-sm text-gray-500 mb-4">Bu əməliyyatlar geri alına bilməz</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                        Bütün məlumatları sil
                      </button>
                      <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                        Hesabı sil
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  )
}