// app/(storefront)/account/AccountClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Bell,
  Heart,
  ShoppingBag,
  LogOut,
  Edit3,
  Plus,
  Trash2,
  Check,
  Star,
  Shield,
  Award,
  Leaf,
  Mail,
  AlertCircle,
  CheckCircle2,
  Copy,
  Share2,
  ChevronDown,
  BarChart2,
  Users,
  Save,
  RefreshCw,
} from "lucide-react";
import type { Address, CustomerPreferences } from "@/lib/auth-store";
import { useAuth } from "@/lib/auth-store";
import { useToast } from "@/components/ui/Toast";

// ─── Types ────────────────────────────────────────────────
type Tab =
  | "overview"
  | "orders"
  | "wishlist"
  | "addresses"
  | "preferences"
  | "notifications"
  | "loyalty"
  | "security"
  | "social"
  | "analytics";

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: string[];
  rating?: number;
  orderNumber?: string;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  inStock: boolean;
  category: string;
}

interface AccountAnalytics {
  totalSpent: number;
  orderCount: number;
  deliveredCount: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  categoryBreakdown: { label: string; amount: number; pct: number }[];
}

interface AccountLoyalty {
  points: number;
  referralCode: string;
  referralReward: number;
  tier: {
    name: string;
    emoji: string;
    nextTierName: string | null;
    nextThreshold: number | null;
    progressPercent: number;
  };
}

interface AccountSecurity {
  score: number;
  maxScore: number;
  twoFactorEnabled: boolean;
  tips: string[];
  sessions: { id: string; device: string; location: string; time: string; current: boolean }[];
}

// ─── Constants ────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; step: number }> = {
  pending: { label: "Gözləyir", color: "#f59e0b", bg: "#fef3c7", icon: "⏳", step: 0 },
  confirmed: { label: "Təsdiqləndi", color: "#3b82f6", bg: "#dbeafe", icon: "✓", step: 1 },
  preparing: { label: "Hazırlanır", color: "#8b5cf6", bg: "#ede9fe", icon: "👨‍🍳", step: 2 },
  ready_for_delivery: { label: "Çatdırılmağa hazır", color: "#6366f1", bg: "#e0e7ff", icon: "📦", step: 3 },
  out_for_delivery: { label: "Yolda", color: "#f97316", bg: "#ffedd5", icon: "🚚", step: 4 },
  delivered: { label: "Çatdırıldı", color: "#10b981", bg: "#d1fae5", icon: "✅", step: 5 },
  cancelled: { label: "Ləğv edildi", color: "#ef4444", bg: "#fee2e2", icon: "❌", step: 0 },
  refunded: { label: "Geri qaytarıldı", color: "#64748b", bg: "#f1f5f9", icon: "↩️", step: 0 },
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Ümumi", icon: <User className="w-4 h-4" /> },
  { id: "orders", label: "Sifarişlər", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "wishlist", label: "İstəklər", icon: <Heart className="w-4 h-4" /> },
  { id: "addresses", label: "Ünvanlar", icon: <MapPin className="w-4 h-4" /> },
  { id: "preferences", label: "Üstünlüklər", icon: <Leaf className="w-4 h-4" /> },
  { id: "notifications", label: "Bildirişlər", icon: <Bell className="w-4 h-4" /> },
  { id: "social", label: "Sosial", icon: <Users className="w-4 h-4" /> },
  { id: "analytics", label: "Statistika", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "loyalty", label: "Loyallıq", icon: <Award className="w-4 h-4" /> },
  { id: "security", label: "Təhlükəsizlik", icon: <Shield className="w-4 h-4" /> },
];

const CATEGORY_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

// ─── Helper ────────────────────────────────────────────────
function isDeliveredStatus(status: string) {
  const normalized = status.toUpperCase();
  return normalized === "DELIVERED" || normalized === "REFUNDED";
}

// ─── Props ─────────────────────────────────────────────────
interface AccountClientProps {
  initialUser: any;
  initialOrders: Order[];
  initialWishlist: WishlistItem[];
  initialAddresses: Address[];
  initialPreferences: CustomerPreferences;
  initialAnalytics: AccountAnalytics | null;
  initialLoyalty: AccountLoyalty | null;
  initialSecurity: AccountSecurity | null;
}

// ─── Component ─────────────────────────────────────────────
export default function AccountClient({
  initialUser,
  initialOrders,
  initialWishlist,
  initialAddresses,
  initialPreferences,
  initialAnalytics,
  initialLoyalty,
  initialSecurity,
}: AccountClientProps) {
  const { updateProfile, logout } = useAuth();
  const router = useRouter();
  const toastCtx = useToast() as any; // tip uyğunsuzluğunu aradan qaldırırıq
  const toast = toastCtx?.toast;
  const showToast = toastCtx?.show || toastCtx?.showToast || (() => {});

  // ─── State ──────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(initialWishlist);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [preferences, setPreferences] = useState<CustomerPreferences>(initialPreferences);
  const [analytics, setAnalytics] = useState<AccountAnalytics | null>(initialAnalytics);
  const [loyalty, setLoyalty] = useState<AccountLoyalty | null>(initialLoyalty);
  const [security, setSecurity] = useState<AccountSecurity | null>(initialSecurity);

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: initialUser.name || "",
    phone: initialUser.phone || "",
  });

  // Address add/edit
  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddr, setNewAddr] = useState({
    label: "",
    fullAddress: "",
    city: "Bakı",
    district: "",
    phone: "",
    type: "HOME" as Address["type"],
    isDefault: false,
  });

  // Orders
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderRatings, setOrderRatings] = useState<Record<string, number>>({});
  const [orderFilter, setOrderFilter] = useState("all");

  // Social
  const [socialForm, setSocialForm] = useState({
    instagram: initialUser.instagram || "",
    telegram: initialUser.telegram || "",
    whatsapp: initialUser.whatsapp || "",
    facebook: initialUser.facebook || "",
  });
  const [editingSocial, setEditingSocial] = useState(false);

  // Referral copy state
  const [copiedRef, setCopiedRef] = useState(false);

  // ─── Derived ────────────────────────────────────────────
  const loyaltyPoints = loyalty?.points ?? analytics?.loyaltyPoints ?? 0;
  const totalSpent =
    analytics?.totalSpent ??
    orders.filter((o) => isDeliveredStatus(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const referralCode = loyalty?.referralCode ?? `OG-${(initialUser?.id || "").slice(-6).toUpperCase()}`;
  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  // ─── Refresh handlers ────────────────────────────────────
  const refreshAnalytics = async () => {
    try {
      const res = await fetch("/api/account/analytics", { credentials: "include" });
      if (res.ok) setAnalytics(await res.json());
    } catch {}
  };
  const refreshLoyalty = async () => {
    try {
      const res = await fetch("/api/account/loyalty", { credentials: "include" });
      if (res.ok) setLoyalty(await res.json());
    } catch {}
  };
  const refreshSecurity = async () => {
    try {
      const res = await fetch("/api/account/security", { credentials: "include" });
      if (res.ok) setSecurity(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (tab === "analytics") refreshAnalytics();
    if (tab === "loyalty") refreshLoyalty();
    if (tab === "security") refreshSecurity();
  }, [tab]);

  // ─── Profile ─────────────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        updateProfile(profileForm);
        setEditProfile(false);
        showToast("Profil yeniləndi ✓");
      } else {
        const data = await res.json();
        showToast(data.error || "Xəta", "error");
      }
    } catch {
      showToast("Şəbəkə xətası", "error");
    }
  };

  // ─── Addresses ───────────────────────────────────────────
  const resetAddressForm = () => {
    setNewAddr({
      label: "",
      fullAddress: "",
      city: "Bakı",
      district: "",
      phone: "",
      type: "HOME",
      isDefault: false,
    });
    setAddingAddress(false);
    setEditingAddressId(null);
  };

  const startEditAddress = (addr: Address) => {
    setNewAddr({
      label: addr.label,
      fullAddress: addr.fullAddress,
      city: addr.city || "Bakı",
      district: addr.district || "",
      phone: addr.phone || "",
      type: addr.type || "HOME",
      isDefault: addr.isDefault || false,
    });
    setEditingAddressId(addr.id);
    setAddingAddress(true);
  };

  const handleSaveAddress = async () => {
    if (!newAddr.label || !newAddr.fullAddress) return;
    try {
      if (editingAddressId) {
        const res = await fetch(`/api/account/addresses/${editingAddressId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddr),
        });
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses);
          resetAddressForm();
          showToast("Ünvan yeniləndi ✓");
        } else {
          const data = await res.json();
          showToast(data.error || "Xəta", "error");
        }
      } else {
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddr),
        });
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses);
          resetAddressForm();
          showToast("Ünvan əlavə edildi ✓");
        } else {
          const data = await res.json();
          showToast(data.error || "Xəta", "error");
        }
      }
    } catch {
      showToast("Şəbəkə xətası", "error");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(`/api/account/addresses/${id}`, { method: "DELETE", credentials: "include" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast("Ünvan silindi ✓");
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
        showToast("Əsas ünvan təyin edildi ✓");
      }
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  // ─── Orders & Rating ─────────────────────────────────────
  const handleRateOrder = async (orderId: string, rating: number) => {
    try {
      await fetch(`/api/account/orders/${orderId}/rate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setOrderRatings((prev) => ({ ...prev, [orderId]: rating }));
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, rating } : o)));
      showToast("Qiymətləndirməniz üçün təşəkkürlər! ✓");
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  // ─── Wishlist ────────────────────────────────────────────
  const handleRemoveWishlistItem = async (itemId: string) => {
    try {
      await fetch(`/api/account/wishlist/${itemId}`, { method: "DELETE", credentials: "include" });
      setWishlist((prev) => prev.filter((i) => i.id !== itemId));
      showToast("Məhsul istək siyahısından silindi ✓");
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  // ─── Preferences ─────────────────────────────────────────
  const handleUpdatePreferences = async (newPrefs: Partial<CustomerPreferences>) => {
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
        showToast("Üstünlüklər yeniləndi ✓");
      }
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  // ─── Notifications ───────────────────────────────────────
  const handleToggleNotification = async (key: string, value: boolean) => {
    const base = {
      orderUpdates: preferences.notifications?.orderUpdates ?? false,
      promotions: preferences.notifications?.promotions ?? false,
      newProducts: preferences.notifications?.newProducts ?? false,
      newsletter: preferences.notifications?.newsletter ?? false,
    };
    const updated = { ...base, [key]: value };
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: updated }),
      });
      if (res.ok) {
        setPreferences((prev) => ({ ...prev, notifications: updated }));
        showToast("Bildiriş tənzimlənməsi yeniləndi ✓");
      }
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  // ─── Social ──────────────────────────────────────────────
  const handleSaveSocial = async () => {
    try {
      const res = await fetch("/api/account/social", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socialForm),
      });
      if (res.ok) {
        setEditingSocial(false);
        showToast("Sosial şəbəkələr yadda saxlandı ✓");
      }
    } catch {
      showToast("Xəta baş verdi", "error");
    }
  };

  // ─── Referral ────────────────────────────────────────────
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    showToast("Referans kodu kopyalandı!");
  };

  const shareReferralCode = async () => {
    const text = `Organik Gədəbəy-də qeydiyyatdan keç və ${loyalty?.referralReward ?? 50} loyallıq puanı qazan! Kod: ${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Organik Gədəbəy", text });
      } catch {}
    } else {
      copyReferralCode();
    }
  };

  // ─── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // ─── UI helpers ──────────────────────────────────────────
  const inp =
    "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm";

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-green-50/40 relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-semibold text-sm text-white shadow-2xl"
            style={{
              background:
                toast.type === "success"
                  ? "#16a34a"
                  : toast.type === "error"
                  ? "#dc2626"
                  : "#0ea5e9",
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 inline mr-2" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-lg">
              🌿
            </div>
            <span className="hidden sm:block font-black text-gray-800">Organik Gədəbəy</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border text-red-500 hover:bg-red-50 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Çıxış</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-3xl font-black">
              {initialUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black">{initialUser.name}</h1>
              <p className="text-gray-500 text-sm">{initialUser.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Üzv olma:{" "}
                {initialUser.createdAt
                  ? new Date(initialUser.createdAt).toLocaleDateString("az-AZ")
                  : "—"}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{loyaltyPoints} puan</span>
                  <span>500 puan → Gümüş</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min((loyaltyPoints / 500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { emoji: "📦", val: orders.length, label: "Sifariş" },
                { emoji: "⭐", val: loyaltyPoints, label: "Puan" },
                { emoji: "❤️", val: wishlist.length, label: "İstək" },
                { emoji: "💰", val: `₼${totalSpent.toFixed(0)}`, label: "Xərcləndi" },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <div className="text-lg">{s.emoji}</div>
                  <div className="font-black">{s.val}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileTabOpen(!mobileTabOpen)}
            className="w-full flex justify-between items-center p-4 bg-white rounded-2xl border font-semibold"
          >
            <span className="flex items-center gap-2">
              {TABS.find((t) => t.id === tab)?.icon}{" "}
              {TABS.find((t) => t.id === tab)?.label}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${mobileTabOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {mobileTabOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden bg-white rounded-2xl mt-1 border"
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      setMobileTabOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-50 border-b last:border-none ${
                      tab === t.id ? "text-emerald-600 font-bold bg-emerald-50" : "text-gray-600"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 gap-1">
            <div className="bg-white rounded-3xl border p-3 sticky top-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm ${
                    tab === t.id
                      ? "bg-emerald-50 text-emerald-600 font-bold"
                      : "text-gray-600"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-red-500 hover:bg-red-50 font-semibold"
              >
                <LogOut className="w-4 h-4" /> Çıxış
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ─── OVERVIEW ──────────────────────────────── */}
              {tab === "overview" && (
                <OverviewTab
                  initialUser={initialUser}
                  orders={orders}
                  editProfile={editProfile}
                  setEditProfile={setEditProfile}
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  handleSaveProfile={handleSaveProfile}
                  inp={inp}
                  setTab={setTab}
                />
              )}

              {/* ─── ORDERS ────────────────────────────────── */}
              {tab === "orders" && (
                <OrdersTab
                  filteredOrders={filteredOrders}
                  orderFilter={orderFilter}
                  setOrderFilter={setOrderFilter}
                  expandedOrder={expandedOrder}
                  setExpandedOrder={setExpandedOrder}
                  orderRatings={orderRatings}
                  handleRateOrder={handleRateOrder}
                />
              )}

              {/* ─── WISHLIST ──────────────────────────────── */}
              {tab === "wishlist" && (
                <WishlistTab
                  wishlist={wishlist}
                  handleRemoveWishlistItem={handleRemoveWishlistItem}
                />
              )}

              {/* ─── ADDRESSES ─────────────────────────────── */}
              {tab === "addresses" && (
                <AddressesTab
                  addresses={addresses}
                  addingAddress={addingAddress}
                  setAddingAddress={setAddingAddress}
                  editingAddressId={editingAddressId}
                  newAddr={newAddr}
                  setNewAddr={setNewAddr}
                  handleSaveAddress={handleSaveAddress}
                  handleDeleteAddress={handleDeleteAddress}
                  handleSetDefaultAddress={handleSetDefaultAddress}
                  startEditAddress={startEditAddress}
                  resetAddressForm={resetAddressForm}
                  inp={inp}
                />
              )}

              {/* ─── PREFERENCES ───────────────────────────── */}
              {tab === "preferences" && (
                <PreferencesTab
                  preferences={preferences}
                  handleUpdatePreferences={handleUpdatePreferences}
                />
              )}

              {/* ─── NOTIFICATIONS ─────────────────────────── */}
              {tab === "notifications" && (
                <NotificationsTab
                  preferences={preferences}
                  handleToggleNotification={handleToggleNotification}
                />
              )}

              {/* ─── SOCIAL ────────────────────────────────── */}
              {tab === "social" && (
                <SocialTab
                  socialForm={socialForm}
                  setSocialForm={setSocialForm}
                  editingSocial={editingSocial}
                  setEditingSocial={setEditingSocial}
                  handleSaveSocial={handleSaveSocial}
                  inp={inp}
                />
              )}

              {/* ─── ANALYTICS ─────────────────────────────── */}
              {tab === "analytics" && (
                <AnalyticsTab
                  totalSpent={totalSpent}
                  orders={orders}
                  analytics={analytics}
                  refreshAnalytics={refreshAnalytics}
                />
              )}

              {/* ─── LOYALTY ───────────────────────────────── */}
              {tab === "loyalty" && (
                <LoyaltyTab
                  loyalty={loyalty}
                  loyaltyPoints={loyaltyPoints}
                  referralCode={referralCode}
                  copiedRef={copiedRef}
                  copyReferralCode={copyReferralCode}
                  shareReferralCode={shareReferralCode}
                  refreshLoyalty={refreshLoyalty}
                />
              )}

              {/* ─── SECURITY ──────────────────────────────── */}
              {tab === "security" && (
                <SecurityTab
                  security={security}
                  refreshSecurity={refreshSecurity}
                />
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB‑COMPONENTS
// ═══════════════════════════════════════════════════════════════

function OverviewTab({
  initialUser,
  orders,
  editProfile,
  setEditProfile,
  profileForm,
  setProfileForm,
  handleSaveProfile,
  inp,
  setTab,
}: any) {
  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Ümumi baxış</h2>
        <button
          onClick={() => setEditProfile(!editProfile)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        >
          <Edit3 className="w-3.5 h-3.5" /> {editProfile ? "Ləğv et" : "Düzəliş et"}
        </button>
      </div>
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-6 sm:p-8">
        {!editProfile ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-3xl font-black">
              {initialUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black">{initialUser.name}</h1>
              <p className="text-gray-500 text-sm">{initialUser.email}</p>
              <p className="text-xs text-gray-400 mt-1">Telefon: {initialUser.phone || "Əlavə edilməyib"}</p>
              <p className="text-xs text-gray-400">
                Üzv olma:{" "}
                {initialUser.createdAt
                  ? new Date(initialUser.createdAt).toLocaleDateString("az-AZ")
                  : "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ad və soyad</label>
              <input
                type="text"
                className={inp}
                value={profileForm.name}
                onChange={(e: any) => setProfileForm((p: any) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefon nömrəsi</label>
              <input
                type="tel"
                className={inp}
                value={profileForm.phone}
                onChange={(e: any) => setProfileForm((p: any) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveProfile} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2">
                <Save className="w-4 h-4" /> Saxla
              </button>
              <button onClick={() => setEditProfile(false)} className="px-5 py-2.5 border rounded-xl font-semibold">
                Ləğv et
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "🛒", label: "Alış-veriş", href: "/products" },
          { emoji: "📦", label: "Sifarişlər", action: () => setTab("orders") },
          { emoji: "❤️", label: "İstəklər", action: () => setTab("wishlist") },
          { emoji: "🎁", label: "Loyallıq", action: () => setTab("loyalty") },
        ].map((a, i) =>
          a.href ? (
            <Link key={i} href={a.href} className="bg-white rounded-2xl border p-4 flex flex-col items-center gap-2 hover:border-emerald-200">
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-bold">{a.label}</span>
            </Link>
          ) : (
            <button key={i} onClick={a.action} className="bg-white rounded-2xl border p-4 flex flex-col items-center gap-2 hover:border-emerald-200">
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-bold">{a.label}</span>
            </button>
          )
        )}
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <h3 className="font-bold mb-3">Son sifarişlər</h3>
        {orders.slice(0, 3).map((o: any) => {
          const s = STATUS_CONFIG[o.status] || { icon: "", label: "", bg: "", color: "" };
          return (
            <div key={o.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl mb-2">
              <div className="flex items-center gap-3">
                <span>{s.icon}</span>
                <div>
                  <div className="font-bold text-sm">{o.id}</div>
                  <div className="text-xs text-gray-400">{new Date(o.date).toLocaleDateString("az-AZ")}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black">₼{Number(o.total).toFixed(2)}</div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-center text-gray-400 py-4">Hələ sifarişiniz yoxdur</p>}
      </div>
    </motion.div>
  );
}

function OrdersTab({
  filteredOrders,
  orderFilter,
  setOrderFilter,
  expandedOrder,
  setExpandedOrder,
  orderRatings,
  handleRateOrder,
}: any) {
  return (
    <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Sifarişlər</h2>
        <span className="text-sm text-gray-500">{filteredOrders.length} sifariş</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "Hamısı" },
          { id: "pending", label: "⏳ Gözləyir" },
          { id: "preparing", label: "👨‍🍳 Hazırlanır" },
          { id: "out_for_delivery", label: "🚚 Yolda" },
          { id: "delivered", label: "✅ Çatdırıldı" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setOrderFilter(f.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold border ${
              orderFilter === f.id
                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filteredOrders.map((order: any) => {
        const s = STATUS_CONFIG[order.status] || { icon: "", label: "", bg: "", color: "", step: 0 };
        const isOpen = expandedOrder === order.id;
        const rating = orderRatings[order.id] || order.rating;
        return (
          <div key={order.id} className="bg-white rounded-3xl border overflow-hidden">
            <button
              onClick={() => setExpandedOrder(isOpen ? null : order.id)}
              className="w-full flex justify-between p-5 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: s.bg }}>
                  {s.icon}
                </div>
                <div>
                  <div className="font-black">{order.id}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(order.date).toLocaleDateString("az-AZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  {rating && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-black text-lg">₼{Number(order.total).toFixed(2)}</div>
                  <div className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t"
                >
                  <div className="p-5 space-y-4">
                    {order.status !== "cancelled" && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2">Sifariş izlənməsi</p>
                        <div className="flex items-center gap-2">
                          {[
                            { step: 1, label: "Qəbul", icon: "📋" },
                            { step: 2, label: "Yolda", icon: "🚚" },
                            { step: 3, label: "Çatdı", icon: "🏠" },
                          ].map((st, j) => (
                            <div key={j} className="flex items-center flex-1">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                    s.step >= st.step ? "bg-emerald-500" : "bg-gray-200"
                                  }`}
                                >
                                  {s.step >= st.step ? <Check className="w-4 h-4 text-white" /> : st.icon}
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1">{st.label}</span>
                              </div>
                              {j < 2 && (
                                <div
                                  className="flex-1 h-0.5 mb-4 mx-1 rounded-full"
                                  style={{ background: s.step > st.step ? "#16a34a" : "#e5e7eb" }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-2">Məhsullar</p>
                      {order.items.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-none text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {item}
                        </div>
                      ))}
                    </div>
                    {order.status === "delivered" && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2">Qiymətləndir</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => handleRateOrder(order.id, star)}>
                              <Star
                                className={`w-6 h-6 ${
                                  (rating || 0) >= star ? "fill-amber-400 text-amber-400" : "text-gray-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

function WishlistTab({ wishlist, handleRemoveWishlistItem }: any) {
  return (
    <motion.div key="wishlist" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">İstək siyahısı ({wishlist.length})</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {wishlist.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl border p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl">
              {item.emoji}
            </div>
            <div className="flex-1">
              <div className="font-bold truncate">{item.name}</div>
              <div className="text-xs text-gray-400">{item.category}</div>
              <div className="font-black text-emerald-600">₼{Number(item.price).toFixed(2)}</div>
              {!item.inStock && <div className="text-xs text-red-500">⚠️ Stokda yoxdur</div>}
            </div>
            <button
              onClick={() => handleRemoveWishlistItem(item.id)}
              className="p-2 text-red-400 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {wishlist.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>İstək siyahınız boşdur</p>
            <Link href="/products" className="text-emerald-600 font-bold mt-2 inline-block">
              Məhsullara bax →
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddressesTab({
  addresses,
  addingAddress,
  setAddingAddress,
  editingAddressId,
  newAddr,
  setNewAddr,
  handleSaveAddress,
  handleDeleteAddress,
  handleSetDefaultAddress,
  startEditAddress,
  resetAddressForm,
  inp,
}: any) {
  return (
    <motion.div key="addresses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Ünvanlarım</h2>
        <button
          onClick={() => {
            resetAddressForm();
            setAddingAddress(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Əlavə et
        </button>
      </div>
      <AnimatePresence>
        {addingAddress && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl border p-6 space-y-4">
              <h3 className="font-bold">{editingAddressId ? "Ünvanı düzəlt" : "Yeni ünvan"}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Ad</label>
                  <input className={inp} value={newAddr.label} onChange={(e: any) => setNewAddr((a: any) => ({ ...a, label: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Telefon</label>
                  <input className={inp} value={newAddr.phone} onChange={(e: any) => setNewAddr((a: any) => ({ ...a, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Rayon</label>
                  <input className={inp} value={newAddr.district} onChange={(e: any) => setNewAddr((a: any) => ({ ...a, district: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Növ</label>
                  <select
                    className={inp}
                    value={newAddr.type}
                    onChange={(e: any) => setNewAddr((a: any) => ({ ...a, type: e.target.value }))}
                  >
                    <option value="HOME">🏠 Ev</option>
                    <option value="WORK">💼 İş</option>
                    <option value="OTHER">📍 Digər</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Tam ünvan</label>
                <input className={inp} value={newAddr.fullAddress} onChange={(e: any) => setNewAddr((a: any) => ({ ...a, fullAddress: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAddr.isDefault}
                  onChange={(e) => setNewAddr((a: any) => ({ ...a, isDefault: e.target.checked }))}
                  className="accent-emerald-500"
                />{" "}
                Əsas ünvan
              </label>
              <div className="flex gap-2">
                <button onClick={handleSaveAddress} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  {editingAddressId ? "Yenilə" : "Əlavə et"}
                </button>
                <button onClick={resetAddressForm} className="px-5 py-2.5 border rounded-xl">
                  Ləğv et
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {addresses.map((addr: any) => (
        <div key={addr.id} className="bg-white rounded-2xl border p-5 flex justify-between items-start" style={{ borderColor: addr.isDefault ? "#bbf7d0" : "#f3f4f6" }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-2xl grid place-items-center text-xl">
              {addr.type === "HOME" ? "🏠" : addr.type === "WORK" ? "💼" : "📍"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{addr.label}</span>
                {addr.isDefault && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Əsas</span>}
              </div>
              <p className="text-sm text-gray-600">{addr.fullAddress}</p>
              <p className="text-xs text-gray-400">{addr.city}{addr.district ? `, ${addr.district}` : ""}</p>
              {addr.phone && <p className="text-xs text-gray-400">{addr.phone}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {!addr.isDefault && (
              <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-xs border border-emerald-200 text-emerald-600 px-2 py-1 rounded-xl">
                Əsas et
              </button>
            )}
            <button onClick={() => startEditAddress(addr)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function PreferencesTab({ preferences, handleUpdatePreferences }: any) {
  return (
    <motion.div key="preferences" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
      <h2 className="text-xl font-black">Üstünlüklərim</h2>
      <div className="bg-white rounded-3xl border p-6 space-y-6">
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Alış-veriş tezliyi</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "daily", label: "⚡ Hər gün" },
              { value: "weekly", label: "📅 Həftəlik" },
              { value: "monthly", label: "🗓️ Aylıq" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => handleUpdatePreferences({ shoppingFrequency: f.value })}
                className={`p-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  preferences.shoppingFrequency === f.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Qida məhdudiyyətləri</h3>
          <div className="flex flex-wrap gap-2">
            {["Vegetarian", "Vegan", "Gluten-free", "Südsüz", "Şəkərsiz", "Üzvi"].map((d) => {
              const active = preferences.dietaryRestrictions?.includes(d) ?? false;
              return (
                <button
                  key={d}
                  onClick={() => {
                    const cur = preferences.dietaryRestrictions || [];
                    handleUpdatePreferences({
                      dietaryRestrictions: active ? cur.filter((x: string) => x !== d) : [...cur, d],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs border-2 font-semibold transition-all ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Sevimli meyvələr</h3>
          <div className="flex flex-wrap gap-2">
            {["alma", "limon", "uzum", "ciyələk", "şaftalı", "armud", "portağal"].map((f) => {
              const active = preferences.favoriteFruits?.includes(f) ?? false;
              return (
                <button
                  key={f}
                  onClick={() => {
                    const cur = preferences.favoriteFruits || [];
                    handleUpdatePreferences({
                      favoriteFruits: active ? cur.filter((x: string) => x !== f) : [...cur, f],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs border-2 transition-all capitalize ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {f}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Sevimli tərəvəzlər</h3>
          <div className="flex flex-wrap gap-2">
            {["yerkökü", "pomidor", "brokkoli", "ispanak", "soğan", "biber", "xiyar"].map((v) => {
              const active = preferences.favoriteVegetables?.includes(v) ?? false;
              return (
                <button
                  key={v}
                  onClick={() => {
                    const cur = preferences.favoriteVegetables || [];
                    handleUpdatePreferences({
                      favoriteVegetables: active ? cur.filter((x: string) => x !== v) : [...cur, v],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs border-2 transition-all capitalize ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsTab({ preferences, handleToggleNotification }: any) {
  return (
    <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <h2 className="text-xl font-black">Bildiriş tənzimləmələri</h2>
      <div className="bg-white rounded-3xl border p-6 space-y-3">
        {[
          { key: "orderUpdates", label: "📦 Sifariş yeniləmələri", desc: "Sifarişinizin statusu dəyişdikdə" },
          { key: "promotions", label: "🎁 Kampaniyalar", desc: "Endirimlər və xüsusi təkliflər" },
          { key: "newProducts", label: "🌱 Yeni məhsullar", desc: "Yeni məhsullar əlavə edildiyi vaxt" },
          { key: "newsletter", label: "📰 Xəbər bülleteni", desc: "Həftəlik email bildirişlər" },
        ].map((n) => {
          const checked = preferences.notifications?.[n.key] ?? false;
          return (
            <div key={n.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-emerald-50 transition-colors">
              <div className="flex-1 mr-4">
                <div className="font-semibold text-gray-900 text-sm">{n.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{n.desc}</div>
              </div>
              <button
                onClick={() => handleToggleNotification(n.key, !checked)}
                className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <motion.div
                  animate={{ x: checked ? 16 : 0 }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function SocialTab({ socialForm, setSocialForm, editingSocial, setEditingSocial, handleSaveSocial, inp }: any) {
  return (
    <motion.div key="social" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Sosial şəbəkələr</h2>
        <button
          onClick={() => setEditingSocial(!editingSocial)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {editingSocial ? "Ləğv et" : "Düzəliş et"}
        </button>
      </div>
      <div className="bg-white rounded-3xl border p-6 space-y-4">
        {[
          { key: "instagram", label: "📸 Instagram", placeholder: "@istifadeci_adi" },
          { key: "whatsapp", label: "💬 WhatsApp", placeholder: "+994 50 000 00 00" },
          { key: "telegram", label: "✈️ Telegram", placeholder: "@telegram_adi" },
          { key: "facebook", label: "👤 Facebook", placeholder: "profil linki" },
        ].map((s) => (
          <div key={s.key}>
            <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">{s.label}</label>
            {editingSocial ? (
              <input
                type="text"
                value={socialForm[s.key]}
                onChange={(e: any) => setSocialForm((f: any) => ({ ...f, [s.key]: e.target.value }))}
                placeholder={s.placeholder}
                className={inp}
              />
            ) : (
              <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-xl">
                {socialForm[s.key] || "Əlavə edilməyib"}
              </p>
            )}
          </div>
        ))}
        {editingSocial && (
          <div className="flex gap-2 pt-2">
            <button onClick={handleSaveSocial} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
              Saxla
            </button>
            <button onClick={() => setEditingSocial(false)} className="px-5 py-2.5 border rounded-xl">
              Ləğv et
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AnalyticsTab({ totalSpent, orders, analytics, refreshAnalytics }: any) {
  return (
    <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Alış-veriş statistikası</h2>
        <button onClick={refreshAnalytics} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "💰", val: `₼${totalSpent.toFixed(2)}`, label: "Ümumi xərc", color: "#16a34a" },
          { emoji: "📦", val: analytics?.orderCount ?? orders.length, label: "Sifariş sayı", color: "#3b82f6" },
          { emoji: "📊", val: `₼${(analytics?.averageOrderValue ?? 0).toFixed(2)}`, label: "Ortalama", color: "#d97706" },
          { emoji: "⭐", val: analytics?.loyaltyPoints ?? 0, label: "Qazanılan puan", color: "#7c3aed" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border p-4 text-center">
            <div className="text-2xl mb-2">{s.emoji}</div>
            <div className="text-xl font-black" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <h3 className="font-black text-gray-900 mb-4">Kateqoriya üzrə xərc</h3>
        {(analytics?.categoryBreakdown?.length
          ? analytics.categoryBreakdown
          : [{ label: "Hələ məlumat yoxdur", pct: 0 }]
        ).map((cat: any, i: number) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">{cat.label}</span>
              <span className="font-black" style={{ color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                {cat.pct}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${cat.pct}%`,
                  background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function LoyaltyTab({
  loyalty,
  loyaltyPoints,
  referralCode,
  copiedRef,
  copyReferralCode,
  shareReferralCode,
  refreshLoyalty,
}: any) {
  return (
    <motion.div key="loyalty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Loyallıq Proqramı</h2>
        <button onClick={refreshLoyalty} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="bg-white rounded-3xl border shadow-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg, #f0fdf4, transparent)" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-black text-emerald-600">{loyaltyPoints}</div>
              <div className="text-gray-500 text-sm">loyallıq puanı</div>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200">
            {loyalty?.tier.emoji ?? "🌿"} {loyalty?.tier.name ?? "Yaşıl Üzv"}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{loyaltyPoints} puan</span>
            <span>
              {loyalty?.tier.nextThreshold
                ? `${loyalty.tier.nextThreshold} puan → ${loyalty.tier.nextTierName}`
                : "Ən yüksək səviyyə"}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
              style={{ width: `${loyalty?.tier.progressPercent ?? Math.min((loyaltyPoints / 500) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <h3 className="font-black mb-3">Dost dəvət et, puan qazan</h3>
        <p className="text-sm text-gray-500 mb-4">
          Hər uğurlu dəvət üçün {loyalty?.referralReward ?? 50} loyallıq puanı
        </p>
        <div className="flex gap-2">
          <div className="flex-1 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl font-mono font-black text-emerald-600 text-center text-lg tracking-widest">
            {referralCode}
          </div>
          <button
            onClick={copyReferralCode}
            className="p-3 rounded-2xl border-2 border-gray-200 hover:border-emerald-300"
          >
            {copiedRef ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
          </button>
          <button
            onClick={shareReferralCode}
            className="p-3 rounded-2xl border-2 border-gray-200 hover:border-emerald-300"
          >
            <Share2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SecurityTab({ security, refreshSecurity }: any) {
  return (
    <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Təhlükəsizlik</h2>
        <button onClick={refreshSecurity} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black">Təhlükəsizlik balı</h3>
          <div className="text-2xl font-black text-emerald-600">
            {security?.score ?? 0}/{security?.maxScore ?? 100}
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-emerald-500"
            style={{ width: `${security?.score ?? 0}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {security?.tips?.[0] ?? "Hesabınızın təhlükəsizliyini artırmaq üçün email və telefon doğrulayın"}
        </p>
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-bold">İki mərhələli doğrulama</div>
              <div className="text-xs text-gray-400">
                {security?.twoFactorEnabled ? "Aktivdir" : "Tezliklə əlçatan olacaq"}
              </div>
            </div>
          </div>
          <button
            disabled={!security?.twoFactorEnabled}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {security?.twoFactorEnabled ? "Aktiv" : "Tezliklə"}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <h3 className="font-bold mb-3">Şifrəni dəyiş</h3>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-3 border rounded-2xl font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Mail className="w-4 h-4" /> Şifrə sıfırlama linki göndər
        </Link>
      </div>
      <div className="bg-white rounded-3xl border p-6">
        <h3 className="font-bold mb-4">Aktiv sessiyalar</h3>
        {(security?.sessions ?? []).map((s: any) => (
          <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl mb-2 last:mb-0">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${s.current ? "bg-emerald-500" : "bg-gray-300"}`} />
              <div>
                <div className="text-sm font-semibold">{s.device}</div>
                <div className="text-xs text-gray-400">
                  {s.location} · {s.time}
                </div>
              </div>
            </div>
            {s.current ? (
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Aktiv</span>
            ) : (
              <button className="text-xs text-red-500 font-semibold hover:underline" disabled>
                Çıxart
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}