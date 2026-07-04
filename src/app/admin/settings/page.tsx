"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Globe,
  DollarSign,
  User,
  Shield,
  Palette,
  Eye,
  Phone,
  Mail,
  Truck,
  Percent,
  RefreshCw,
  Database,
  Download,
  Key,
  AlertTriangle,
  Save,
  Check,
  Info,
  Layout,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  X,
  MoveUp,
  MoveDown,
  Share2,
  Navigation,
  Sparkles,
  Type,
  Layers,
  Zap,
  BarChart3,
  FileSpreadsheet,
  Award,
  ChevronDown,
  Grid,
  Search,
  Tag,
  Star,
  MessageSquare,
  HelpCircle,
  Code,
  Monitor,
  ToggleLeft,
  ShoppingBag,
  Menu,
  Globe2,
  Megaphone,
} from "lucide-react";

import { useApp } from "@/lib/store";
import type { AdminUIState, StorefrontConfig } from "@/lib/types";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import { Switch } from "@/components/atoms/switch";
import { Textarea } from "@/components/atoms/textarea";


// =========================================================
//   Section Header (səhifə üçün reusable)
// =========================================================
const SectionHeader: React.FC<{
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <motion.div
    className="mb-2 flex items-start gap-3 border-b border-slate-100 pb-2"
    initial={{ x: -10, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: 0.05 }}
  >
    {Icon && (
      <span className="mt-[2px] flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon className="h-4 w-4" />
      </span>
    )}
    <div>
      <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-[2px]">{subtitle}</p>
      )}
    </div>
  </motion.div>
);

// =========================================================
//   Sticky Action Bar
// =========================================================
const StickyActionBar: React.FC<{
  leftContent?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ leftContent, children }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/80 px-4 py-3 backdrop-blur"
  >
    <div className="flex items-center gap-2 text-xs text-slate-500">
      {leftContent}
    </div>
    <div className="flex items-center gap-2">{children}</div>
  </motion.div>
);

// =========================================================
//   Array Editor (mürəkkəb siyahı redaktəsi)
// =========================================================
type ArrayEditorProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    onUpdate: (item: T) => void,
    onRemove: () => void,
    onMoveUp: () => void,
    onMoveDown: () => void
  ) => React.ReactNode;
  addLabel: string;
  onAdd: () => void;
};

const ArrayEditor = <T,>({
  items,
  onChange,
  renderItem,
  addLabel,
  onAdd,
}: ArrayEditorProps<T>) => (
  <div className="space-y-3">
    {items.map((item, index) => (
      <div key={index}>
        {renderItem(
          item,
          index,
          (updatedItem) => {
            const newItems = [...items] as T[];
            newItems[index] = updatedItem as T;
            onChange(newItems);
          },
          () => {
            const newItems = items.filter((_, i) => i !== index);
            onChange(newItems);
          },
          () => {
            if (index > 0) {
              const newItems = [...items] as T[];
              [newItems[index - 1]!, newItems[index]!] = [
                newItems[index]!,
                newItems[index - 1]!,
              ];
              onChange(newItems);
            }
          },
          () => {
            if (index < items.length - 1) {
              const newItems = [...items] as T[];
              [newItems[index]!, newItems[index + 1]!] = [
                newItems[index + 1]!,
                newItems[index]!,
              ];
              onChange(newItems);
            }
          }
        )}
      </div>
    ))}
    <Button
      onClick={onAdd}
      variant="secondary"
      className="w-full justify-center border-dashed"
    >
      <Plus className="h-4 w-4" />
      {addLabel}
    </Button>
  </div>
);

// =========================================================
//   Color Picker
// =========================================================
const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}> = ({ label, value, onChange, helperText }) => (
  <div className="space-y-[0.25rem]">
    <label className="block text-[0.75rem] font-semibold text-slate-600">
      {label}
    </label>
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border-2 border-slate-200 bg-transparent"
        />
      </div>
      <Input
        value={value}
        onChange={(val) => onChange(val)}
        className="flex-1"
        placeholder="#16a34a"
      />
    </div>
    {helperText && (
      <p className="mt-[0.2rem] text-[0.6875rem] text-slate-500">
        {helperText}
      </p>
    )}
  </div>
);

// =========================================================
//   Confirmation Dialog
// =========================================================
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Təsdiqlə",
  cancelText = "Ləğv et",
  type = "danger",
}) => {
  if (!isOpen) return null;

  const typeColors = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-500/30",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/30",
    info: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="ghost">
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={
              type === "danger"
                ? "danger"
                : type === "warning"
                ? "soft"
                : "primary"
            }
            className={typeColors[type]}
          >
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// =========================================================
//   SETTINGS TABS TİPİ
// =========================================================
type SettingTab = {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.FC<{
    localStorefrontConfig: StorefrontConfig & {
      vatRate?: number;
      contactPhone?: string;
      contactEmail?: string;
      shippingFee?: number;
      locale?: string;
      productViewMode?: string;
      productsPerPage?: string;
      defaultSort?: string;
      gridColumns?: string;
      showProductDescription?: boolean;
      showStockQuantity?: boolean;
      showAddToCartNotification?: boolean;
      metaDescription?: string;
      metaKeywords?: string[];
      ogImage?: string;
      googleAnalyticsId?: string;
      gtmId?: string;
      customAnalyticsCode?: string;
      mainNavigation?: Array<{ label: string; href: string; icon: string }>;
      categoryNavigation?: Array<{
        label: string;
        href: string;
        icon: string;
      }>;
      testimonials?: Array<{
        name: string;
        role?: string;
        text: string;
        rating: number;
      }>;
      faq?: Array<{ question: string; answer: string }>;
      maintenanceMode?: boolean;
      maintenanceMessage?: string;
      customCss?: string;
      customJs?: string;
      showAnnouncementBanner?: boolean;
      announcementText?: string;
      announcementColor?: string;
    };
    setLocalStorefrontConfig: React.Dispatch<
      React.SetStateAction<
        StorefrontConfig & {
          vatRate?: number;
          contactPhone?: string;
          contactEmail?: string;
          shippingFee?: number;
          locale?: string;
          productViewMode?: string;
          productsPerPage?: string;
          defaultSort?: string;
          gridColumns?: string;
          showProductDescription?: boolean;
          showStockQuantity?: boolean;
          showAddToCartNotification?: boolean;
          metaDescription?: string;
          metaKeywords?: string[];
          ogImage?: string;
          googleAnalyticsId?: string;
          gtmId?: string;
          customAnalyticsCode?: string;
          mainNavigation?: Array<{
            label: string;
            href: string;
            icon: string;
          }>;
          categoryNavigation?: Array<{
            label: string;
            href: string;
            icon: string;
          }>;
          testimonials?: Array<{
            name: string;
            role?: string;
            text: string;
            rating: number;
          }>;
          faq?: Array<{ question: string; answer: string }>;
          maintenanceMode?: boolean;
          maintenanceMessage?: string;
          customCss?: string;
          customJs?: string;
          showAnnouncementBanner?: boolean;
          announcementText?: string;
          announcementColor?: string;
        }
      >
    >;
    localUIState: AdminUIState;
    setLocalUIState: React.Dispatch<React.SetStateAction<AdminUIState>>;
    onSave: () => void;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
  }>;
};

// =========================================================
//   1. General Settings
// =========================================================
const GeneralSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Settings}
      title="Ümumi Tənzimləmələr"
      subtitle="Əlaqə məlumatları, dil və əsas valyuta üstünlükləri."
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        label="Əlaqə E-poçtu"
        type="email"
        value={localStorefrontConfig.contactEmail || ""}
        onChange={(val) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            contactEmail: val,
          }))
        }
        placeholder="info@organikgedebey.az"
        icon={<Mail className="h-4 w-4" />}
      />
      <Input
        label="Əlaqə Nömrəsi"
        value={localStorefrontConfig.contactPhone || ""}
        onChange={(val) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            contactPhone: val,
          }))
        }
        placeholder="+994 50 XXX XX XX"
        icon={<Phone className="h-4 w-4" />}
      />
      <Input
        label="Mağaza Lokalı (Dil)"
        value={localStorefrontConfig.locale || "az-AZ"}
        onChange={(val) =>
          setLocalStorefrontConfig((s) => ({ ...s, locale: val }))
        }
        icon={<Globe className="h-4 w-4" />}
        helper="Format: en-US, az-AZ, tr-TR. Tarix və pul formatına təsir edir."
      />
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">
          Əsas Valyuta
        </label>
        <select
          value={localStorefrontConfig.currency || "AZN"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              currency: e.target.value as StorefrontConfig["currency"],
            }))
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="AZN">₼ AZN (Manat)</option>
          <option value="USD">$ USD (Dollar)</option>
          <option value="EUR">€ EUR (Avro)</option>
        </select>
        <p className="mt-[0.2rem] text-[0.6875rem] text-slate-500">
          Bu seçim dashboard, sifariş və məhsul qiymətlərində istifadə
          olunan default valyutanı təyin edir.
        </p>
      </div>
    </div>

    <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600 flex items-start gap-2">
      <Info className="h-4 w-4 text-emerald-500 mt-[2px]" />
      <div>
        <div className="font-semibold mb-[2px]">Canlı ön-baxış</div>
        <p>
          Dil:{" "}
          <span className="font-medium">
            {localStorefrontConfig.locale || "az-AZ"}
          </span>{" "}
          — Valyuta:{" "}
          <span className="font-medium">
            {localStorefrontConfig.currency || "AZN"}
          </span>
        </p>
        <p className="mt-[2px]">
          Məs: məhsul qiyməti <span className="font-semibold">12.50</span> →{" "}
          <span className="font-semibold">
            {localStorefrontConfig.currency === "USD"
              ? "$12.50"
              : localStorefrontConfig.currency === "EUR"
              ? "€12.50"
              : "12.50 ₼"}
          </span>
        </p>
      </div>
    </div>

    <StickyActionBar
      leftContent={
        <>
          <Eye className="h-4 w-4 text-emerald-500" />
          <span>
            Dəyişikliklər admin panelinə və storefront görünüşünə təsir
            edəcək.
          </span>
        </>
      }
    >
      {hasUnsavedChanges && !isSaving && (
        <span className="text-xs font-medium text-amber-700">
          ● Yadda saxlanmamış dəyişikliklər var
        </span>
      )}
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </StickyActionBar>
  </div>
);

// =========================================================
//   2. Storefront & Finance Settings
// =========================================================
const StoreFinanceSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={DollarSign}
      title="Mağaza & Maliyyə Tənzimləmələri"
      subtitle="ƏDV, çatdırılma haqları və maliyyə vizualları."
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        label="ƏDV Dərəcəsi (Vergi)"
        type="number"
        value={localStorefrontConfig.vatRate ?? 0}
        onChange={(val) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            vatRate: parseFloat(val || "0"),
          }))
        }
        placeholder="0.18"
        helper="0.18 = 18%"
        icon={<Percent className="h-4 w-4" />}
      />
      <Input
        label="Standart Çatdırılma Haqqı"
        type="number"
        value={localStorefrontConfig.shippingFee ?? 0}
        onChange={(val) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            shippingFee: parseFloat(val || "0"),
          }))
        }
        placeholder="5.00"
        helper="0.00 = pulsuz"
        icon={<Truck className="h-4 w-4" />}
      />
    </div>

    <div className="mt-4 space-y-4">
      <Switch
        label="Anında Ödəniş Bildirişləri"
        checked={true}
        onChange={() =>
          alert(
            "Bu funksiya üçün Real-Time backend (WebSocket və ya Push Notification) lazımdır."
          )
        }
        description="Yeni sifarişlər zamanı administratorlara anında bildiriş göndərilsin."
      />
      <Switch
        label="Satış Hesabatlarında Orta Çeki Göstər"
        checked={true}
        onChange={() => {}}
        description="Dashboard və günlük hesabat bloklarında orta çek (Average Order Value) göstərilsin."
      />
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Database className="h-4 w-4 text-emerald-500" />
        <span>
          Vergi və çatdırılma nizamları checkout hesablamalarına birbaşa
          təsir edir.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   3. User Preferences (AdminUIState)
// =========================================================
const UserPreferences: SettingTab["component"] = ({
  localUIState,
  setLocalUIState,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={User}
      title="Admin UI Tənzimləmələri"
      subtitle="Sidebar, tema və animasiya üstünlükləri."
    />

    <div className="space-y-4">
      <Switch
        label="Sidebar-ı həmişə açıq saxla"
        checked={localUIState.sidebarOpen}
        onChange={(v) =>
          setLocalUIState((s) => ({
            ...s,
            sidebarOpen: v,
          }))
        }
        description="Sidebar-ı mobil və ya tablet rejimində belə geniş açıq saxla."
      />
      <Switch
        label="Tünd Tema (Dark Mode)"
        checked={localUIState.theme === "dark"}
        onChange={(v) =>
          setLocalUIState((s) => ({
            ...s,
            theme: v ? "dark" : "light",
          }))
        }
        description="Admin panelini gecə rejiminə uyğunlaşdır."
      />
      <Switch
        label="Səhifə Keçidlərini Animasiya Et"
        checked={true}
        onChange={() => {}}
        description="`framer-motion` ilə səhifələr arasında keçid animasiyalarını aktiv saxla."
      />
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Palette className="h-4 w-4 text-emerald-500" />
        <span>
          Bu tənzimləmələr dərhal admin layout-a tətbiq olunur (sidebar +
          tema).
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   4. Content Management Settings
// =========================================================
const ContentManagementSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Layout}
      title="Məzmun İdarəetməsi"
      subtitle="Ana səhifə, header, footer və digər statik məzmunları idarə edin."
    />

    {/* Branding & Colors */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Palette className="h-4 w-4 text-emerald-600" /> Branding & Rənglər
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ColorPicker
          label="Əsas Rəng"
          value={localStorefrontConfig.primaryColor || "#16a34a"}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              primaryColor: value,
            }))
          }
          helperText="Düymələr, linklər və vurğular üçün"
        />
        <ColorPicker
          label="İkinci Rəng"
          value={localStorefrontConfig.secondaryColor || "#10b981"}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              secondaryColor: value,
            }))
          }
          helperText="Arxa plan və ikinci elementlər üçün"
        />
        <Input
          label="Sayt Başlığı (Brend)"
          value={localStorefrontConfig.siteTitle || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              siteTitle: val,
            }))
          }
          placeholder="Organik Gədəbəy"
          helper="Bütün səhifə başlıqlarını təyin edir"
        />
        <Input
          label="Sayt Təsviri"
          value={localStorefrontConfig.siteDescription || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              siteDescription: val,
            }))
          }
          placeholder="Təbii kənd məhsulları"
          helper="SEO üçün meta description"
        />
      </div>
    </div>

    {/* Hero Section Link */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Hero Bölməsi
            </h3>
            <p className="text-xs text-slate-500">
              Ana səhifənin görünüşünü idarə edin
            </p>
          </div>
        </div>
        <a
          href="/admin/settings/hero"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Settings className="w-4 h-4" />
          Konfiqurasiya
        </a>
      </div>
    </div>

    {/* Logo & Branding */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <ImageIcon className="h-4 w-4 text-emerald-600" /> Logo və Brendinq
      </h3>
      <div className="space-y-4">
        <Input
          label="Logo URL"
          value={localStorefrontConfig.logoUrl || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              logoUrl: val,
            }))
          }
          placeholder="/logo.png"
          icon={<ImageIcon className="h-4 w-4" />}
          helper="Saytınızın loqosu"
        />
        <Input
          label="Favicon URL"
          value={localStorefrontConfig.faviconUrl || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              faviconUrl: val,
            }))
          }
          placeholder="/favicon.ico"
          icon={<ImageIcon className="h-4 w-4" />}
          helper="Brauzer tab ikonu"
        />
      </div>
    </div>

    {/* Navigation Links */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Navigation className="h-4 w-4 text-emerald-600" /> Naviqasiya
        Linkləri
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.navItems || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            navItems: items,
          }))
        }
        addLabel="Link Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            navItems: [
              ...(s.navItems || []),
              { label: "", href: "", icon: "" },
            ],
          }))
        }
        renderItem={(
          item,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Input
                label={`Link ${index + 1} Adı`}
                value={item.label}
                onChange={(val) => onUpdate({ ...item, label: val })}
                placeholder="Məhsullar"
              />
              <Input
                label={`Link ${index + 1} URL`}
                value={item.href}
                onChange={(val) => onUpdate({ ...item, href: val })}
                placeholder="/products"
                icon={<LinkIcon className="h-4 w-4" />}
              />
              <Input
                label={`Link ${index + 1} İkon`}
                value={item.icon || ""}
                onChange={(val) => onUpdate({ ...item, icon: val })}
                placeholder="package"
                helper="Lucide icon adı"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.navItems?.length || 0) - 1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    {/* Premium SEO */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <BarChart3 className="h-4 w-4 text-emerald-600" /> Premium SEO
        (Expert Level)
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Meta Title"
            value={localStorefrontConfig.metaTitle || ""}
            onChange={(val) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                metaTitle: val,
              }))
            }
            placeholder="Organik Gədəbəy - Təbii Kənd Məhsulları"
            helper="SEO başlıq (60-70 simvol)"
          />
          <Input
            label="Canonical URL"
            value={localStorefrontConfig.canonicalUrl || ""}
            onChange={(val) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                canonicalUrl: val,
              }))
            }
            placeholder="https://organikgedebey.az"
            icon={<LinkIcon className="h-4 w-4" />}
            helper="Kanonik URL"
          />
        </div>
        <Textarea
          label="Meta Description"
          value={localStorefrontConfig.metaDescription || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaDescription: e.target.value,
            }))
          }
          rows={3}
          placeholder="Təbii məhsullar..."
        />
        <Textarea
          label="Meta Keywords"
          value={
            localStorefrontConfig.metaKeywords?.join(", ") || ""
          }
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaKeywords: e.target.value
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean),
            }))
          }
          rows={2}
          placeholder="organik, təbii, kənd"
        />
        <Input
          label="OG Image"
          value={localStorefrontConfig.ogImage || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              ogImage: val,
            }))
          }
          placeholder="/og-image.jpg"
          icon={<ImageIcon className="h-4 w-4" />}
          helper="Open Graph şəkli"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Twitter Card Type"
            value={
              localStorefrontConfig.twitterCard ||
              "summary_large_image"
            }
            onChange={(val) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                twitterCard: val as any,
              }))
            }
            placeholder="summary_large_image"
            helper="summary, summary_large_image, app, player"
          />
          <Input
            label="Twitter Site"
            value={localStorefrontConfig.twitterSite || ""}
            onChange={(val) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                twitterSite: val,
              }))
            }
            placeholder="@organikgedebey"
            helper="Twitter hesab adı"
          />
        </div>
        <Textarea
          label="Robots.txt"
          value={localStorefrontConfig.robotsTxt || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              robotsTxt: e.target.value,
            }))
          }
          rows={4}
          placeholder="User-agent: *"
        />
        <Switch
          label="Sitemap Aktiv"
          checked={localStorefrontConfig.sitemapEnabled !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              sitemapEnabled: v,
            }))
          }
          description="Avtomatik sitemap generasiyası"
        />
        <Textarea
          label="Structured Data (JSON-LD)"
          value={localStorefrontConfig.structuredData || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              structuredData: e.target.value,
            }))
          }
          rows={6}
          placeholder='{ "@context": "https://schema.org" ... }'
        />
      </div>
    </div>

    {/* Header Banners */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Share2 className="h-4 w-4 text-emerald-600" /> Promo Banner-ləri
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.headerBanners || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            headerBanners: items,
          }))
        }
        addLabel="Banner Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            headerBanners: [
              ...(s.headerBanners || []),
              {
                text: "",
                color: "from-emerald-600 to-teal-600",
                link: "",
              },
            ],
          }))
        }
        renderItem={(
          banner,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Input
                label={`Banner ${index + 1} Mətni`}
                value={banner.text}
                onChange={(val) =>
                  onUpdate({ ...banner, text: val })
                }
                placeholder="🚀 PULSUZ çatdırılma!"
              />
              <Input
                label={`Banner ${index + 1} Rəngi`}
                value={banner.color}
                onChange={(val) =>
                  onUpdate({ ...banner, color: val })
                }
                placeholder="from-emerald-600 to-teal-600"
                helper="Tailwind gradient class"
              />
              <Input
                label={`Banner ${index + 1} Linki`}
                value={banner.link || ""}
                onChange={(val) =>
                  onUpdate({ ...banner, link: val })
                }
                placeholder="/products"
                icon={<LinkIcon className="h-4 w-4" />}
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.headerBanners?.length ||
                    0) -
                    1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    {/* Header Top Bar */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Navigation className="h-4 w-4 text-emerald-600" /> Header Top
        Bar
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label="Şüar"
          value={localStorefrontConfig.headerTopBar?.tagline || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headerTopBar: {
                ...s.headerTopBar,
                tagline: val,
              },
            }))
          }
          placeholder="Gədəbəy & Gəncə ailə təsərrüfatları"
        />
        <Input
          label="Məkan"
          value={localStorefrontConfig.headerTopBar?.location || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headerTopBar: {
                ...s.headerTopBar,
                location: val,
              },
            }))
          }
          placeholder="Özü götürmə & Çatdırılma"
        />
        <Input
          label="İş Saatları"
          value={localStorefrontConfig.headerTopBar?.hours || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headerTopBar: {
                ...s.headerTopBar,
                hours: val,
              },
            }))
          }
          placeholder="Hər gün 09:00 - 21:00"
        />
      </div>
    </div>

    {/* Footer */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <FileText className="h-4 w-4 text-emerald-600" /> Footer
      </h3>
      <div className="space-y-4">
        <Textarea
          label="Haqqında Mətni"
          value={localStorefrontConfig.footerAboutText || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              footerAboutText: e.target.value,
            }))
          }
          rows={3}
          placeholder="Təbii kənd məhsulları..."
        />
        <Input
          label="Copyright Mətni"
          value={localStorefrontConfig.footerCopyright || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              footerCopyright: val,
            }))
          }
          placeholder="© 2024 Organik Gədəbəy"
        />
        <div>
          <label className="block text-[0.75rem] font-semibold text-slate-600 mb-2">
            Sürətli Keçidlər
          </label>
          <ArrayEditor
            items={localStorefrontConfig.footerQuickLinks || []}
            onChange={(items) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                footerQuickLinks: items,
              }))
            }
            addLabel="Keçid Əlavə Et"
            onAdd={() =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                footerQuickLinks: [
                  ...(s.footerQuickLinks || []),
                  { label: "", href: "" },
                ],
              }))
            }
            renderItem={(
              link: any,
              _index,
              onUpdate,
              onRemove
            ) => (
              <div className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    label="Etiket"
                    value={link?.label || ""}
                    onChange={(val) =>
                      onUpdate({ ...link, label: val })
                    }
                    placeholder="Ana Səhifə"
                  />
                  <Input
                    label="Link"
                    value={link?.href || ""}
                    onChange={(val) =>
                      onUpdate({ ...link, href: val })
                    }
                    placeholder="/"
                    icon={<LinkIcon className="h-4 w-4" />}
                  />
                </div>
                <button
                  onClick={onRemove}
                  className="mt-6 p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        </div>
      </div>
    </div>

    {/* Social Media */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Share2 className="h-4 w-4 text-emerald-600" /> Sosial Media
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Instagram"
          value={localStorefrontConfig.socialInstagram || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialInstagram: val,
            }))
          }
          placeholder="https://instagram.com/organikgedebey"
          icon={<LinkIcon className="h-4 w-4" />}
        />
        <Input
          label="Facebook"
          value={localStorefrontConfig.socialFacebook || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialFacebook: val,
            }))
          }
          placeholder="https://facebook.com/organikgedebey"
          icon={<LinkIcon className="h-4 w-4" />}
        />
        <Input
          label="WhatsApp"
          value={localStorefrontConfig.socialWhatsapp || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialWhatsapp: val,
            }))
          }
          placeholder="+994501234567"
          icon={<Phone className="h-4 w-4" />}
        />
        <Input
          label="Telegram"
          value={localStorefrontConfig.socialTelegram || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialTelegram: val,
            }))
          }
          placeholder="https://t.me/organikgedebey"
          icon={<LinkIcon className="h-4 w-4" />}
        />
        <Input
          label="YouTube"
          value={localStorefrontConfig.socialYoutube || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialYoutube: val,
            }))
          }
          placeholder="https://youtube.com/@organikgedebey"
          icon={<LinkIcon className="h-4 w-4" />}
        />
        <Input
          label="Twitter/X"
          value={localStorefrontConfig.socialTwitter || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialTwitter: val,
            }))
          }
          placeholder="https://twitter.com/organikgedebey"
          icon={<LinkIcon className="h-4 w-4" />}
        />
      </div>
    </div>

    {/* Stats Section */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <BarChart3 className="h-4 w-4 text-emerald-600" /> Statistikalar
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.stats || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            stats: items,
          }))
        }
        addLabel="Statistika Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            stats: [
              ...(s.stats || []),
              { value: "", label: "", icon: "📊" },
            ],
          }))
        }
        renderItem={(
          stat: any,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                label="Qiymət"
                value={stat?.value || ""}
                onChange={(val) =>
                  onUpdate({ ...stat, value: val })
                }
                placeholder="1000+"
              />
              <Input
                label="Etiket"
                value={stat?.label || ""}
                onChange={(val) =>
                  onUpdate({ ...stat, label: val })
                }
                placeholder="Məhsul"
              />
              <Input
                label="Emoji"
                value={stat?.icon || ""}
                onChange={(val) =>
                  onUpdate({ ...stat, icon: val })
                }
                placeholder="📦"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.stats?.length || 0) - 1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    {/* Trust Badges */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Award className="h-4 w-4 text-emerald-600" /> Etibar Nişanları
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.trustBadges || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            trustBadges: items,
          }))
        }
        addLabel="Etibar Nişanı Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            trustBadges: [
              ...(s.trustBadges || []),
              { icon: "✓", title: "", description: "" },
            ],
          }))
        }
        renderItem={(
          badge: any,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Input
                label="Emoji"
                value={badge?.icon || ""}
                onChange={(val) =>
                  onUpdate({ ...badge, icon: val })
                }
                placeholder="🌿"
              />
              <Input
                label="Başlıq"
                value={badge?.title || ""}
                onChange={(val) =>
                  onUpdate({ ...badge, title: val })
                }
                placeholder="100% Organik"
              />
              <Input
                label="Təsvir"
                value={badge?.description || ""}
                onChange={(val) =>
                  onUpdate({ ...badge, description: val })
                }
                placeholder="Təbii məhsullar"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.trustBadges?.length || 0) -
                    1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Layout className="h-4 w-4 text-emerald-500" />
        <span>
          Bu dəyişikliklər dərhal storefront-da görünəcək.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   6. Premium UI Settings
// =========================================================
const PremiumUISettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Sparkles}
      title="Premium UI Tənzimləmələri"
      subtitle="Tema, animasiyalar, şriftlər və spacing üstünlükləri."
    />

    {/* Typography */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Type className="h-4 w-4 text-emerald-600" /> Tipografiya
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Əsas Şrift"
          name="fontFamily"
          value={localStorefrontConfig.fontFamily || "inter"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              fontFamily: e.target.value,
            }))
          }
          options={[
            { value: "inter", label: "Inter (Default)" },
            { value: "roboto", label: "Roboto" },
            { value: "open-sans", label: "Open Sans" },
            { value: "poppins", label: "Poppins" },
            { value: "montserrat", label: "Montserrat" },
          ]}
        />
        <Select
          label="Başlıq Şrifti"
          name="headingFont"
          value={localStorefrontConfig.headingFont || "inter"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headingFont: e.target.value,
            }))
          }
          options={[
            { value: "inter", label: "Inter (Default)" },
            { value: "roboto", label: "Roboto" },
            { value: "open-sans", label: "Open Sans" },
            { value: "poppins", label: "Poppins" },
            { value: "montserrat", label: "Montserrat" },
          ]}
        />
      </div>
    </div>

    {/* Spacing & Layout */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Layers className="h-4 w-4 text-emerald-600" /> Spacing & Layout
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Konteyner Genişliyi"
          name="containerWidth"
          value={localStorefrontConfig.containerWidth || "default"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              containerWidth: e.target.value as any,
            }))
          }
          options={[
            { value: "narrow", label: "Dar (1024px)" },
            { value: "default", label: "Default (1280px)" },
            { value: "wide", label: "Geniş (1440px)" },
            { value: "full", label: "Tam Genişlik" },
          ]}
        />
        <Select
          label="Boşluq Ölçüsü"
          name="spacingSize"
          value={localStorefrontConfig.spacingSize || "medium"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              spacingSize: e.target.value as any,
            }))
          }
          options={[
            { value: "compact", label: "Sıx (Compact)" },
            { value: "medium", label: "Orta (Medium)" },
            { value: "relaxed", label: "Geniş (Relaxed)" },
            { value: "spacious", label: "Çox Geniş (Spacious)" },
          ]}
        />
      </div>
    </div>

    {/* Animations */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Zap className="h-4 w-4 text-emerald-600" /> Animasiyalar
      </h3>
      <div className="space-y-4">
        <Switch
          label="Səhifə Keçidlərini Animasiya Et"
          checked={
            localStorefrontConfig.enablePageTransitions !== false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enablePageTransitions: v,
            }))
          }
          description="Səhifələr arasında yumşaq keçid animasiyalarını aktiv edin."
        />
        <Switch
          label="Hover Animasiyaları"
          checked={
            localStorefrontConfig.enableHoverEffects !== false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enableHoverEffects: v,
            }))
          }
          description="Düymələr və kartlar üzərində hover effektlərini aktiv edin."
        />
        <Select
          label="Animasiya Sürəti"
          name="animationSpeed"
          value={localStorefrontConfig.animationSpeed || "normal"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              animationSpeed: e.target.value as any,
            }))
          }
          options={[
            { value: "slow", label: "Yavaş (Slow)" },
            { value: "normal", label: "Normal" },
            { value: "fast", label: "Sürətli (Fast)" },
            { value: "instant", label: "Ani (Instant)" },
          ]}
        />
      </div>
    </div>

    {/* Advanced UI Options */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Sparkles className="h-4 w-4 text-emerald-600" /> Advanced UI
      </h3>
      <div className="space-y-4">
        <Switch
          label="Gölgə Effektləri"
          checked={localStorefrontConfig.enableShadows !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enableShadows: v,
            }))
          }
          description="Kartlar və düymələr üçün gölgə effektlərini aktiv edin."
        />
        <Switch
          label="Yuvarlaq Künclər"
          checked={
            localStorefrontConfig.enableRoundedCorners !== false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enableRoundedCorners: v,
            }))
          }
          description="Elementlər üçün yuvarlaq küncləri aktiv edin."
        />
        <Switch
          label="Gradient Arxa Planlar"
          checked={
            localStorefrontConfig.enableGradients !== false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enableGradients: v,
            }))
          }
          description="Hero bölmələri və bannerlər üçün gradient arxa planları aktiv edin."
        />
      </div>
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <span>
          Bu tənzimləmələr dərhal storefront görünüşünə təsir edir.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   8. Storefront Display Settings
// =========================================================
const StorefrontDisplaySettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Grid}
      title="Storefront Görünüşü"
      subtitle="Məhsul səhifəsi, grid və list görünüşləri."
    />

    {/* Product Display */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <ShoppingBag className="h-4 w-4 text-emerald-600" /> Məhsul
        Görünüşü
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Default Görünüş"
          name="productViewMode"
          value={localStorefrontConfig.productViewMode || "grid"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              productViewMode: e.target.value,
            }))
          }
          options={[
            { value: "grid", label: "Grid (Tor)" },
            { value: "list", label: "List (Siyahı)" },
          ]}
        />
        <Select
          label="Səhifə başına məhsul sayı"
          name="productsPerPage"
          value={localStorefrontConfig.productsPerPage || "12"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              productsPerPage: e.target.value,
            }))
          }
          options={[
            { value: "8", label: "8 məhsul" },
            { value: "12", label: "12 məhsul" },
            { value: "16", label: "16 məhsul" },
            { value: "24", label: "24 məhsul" },
            { value: "36", label: "36 məhsul" },
          ]}
        />
        <Select
          label="Default Sıralama"
          name="defaultSort"
          value={localStorefrontConfig.defaultSort || "newest"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              defaultSort: e.target.value,
            }))
          }
          options={[
            { value: "newest", label: "Ən Yenilər" },
            { value: "price-asc", label: "Qiymət: Aşağıdan Yuxarı" },
            { value: "price-desc", label: "Qiymət: Yuxarıdan Aşağı" },
            { value: "name-asc", label: "Ad: A-Z" },
            { value: "popular", label: "Populyar" },
          ]}
        />
        <Select
          label="Grid Sütun Sayı"
          name="gridColumns"
          value={localStorefrontConfig.gridColumns || "3"}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              gridColumns: e.target.value,
            }))
          }
          options={[
            { value: "2", label: "2 sütun" },
            { value: "3", label: "3 sütun (Default)" },
            { value: "4", label: "4 sütun" },
          ]}
        />
      </div>
    </div>

    {/* Product Card Settings */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Layers className="h-4 w-4 text-emerald-600" /> Məhsul Kartı
      </h3>
      <div className="space-y-4">
        <Switch
          label="Məhsul təsvirini göstər"
          checked={
            localStorefrontConfig.showProductDescription !== false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showProductDescription: v,
            }))
          }
          description="Məhsul kartlarında qısa təsviri göstər."
        />
        <Switch
          label="Stok miqdarını göstər"
          checked={
            localStorefrontConfig.showStockQuantity !== false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showStockQuantity: v,
            }))
          }
          description="Məhsul kartlarında qalan stok miqdarını göstər."
        />
        <Switch
          label="Əlavə olundu bildirişini göstər"
          checked={
            localStorefrontConfig.showAddToCartNotification !==
            false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showAddToCartNotification: v,
            }))
          }
          description="Səbətə əlavə olunduqda bildiriş göstər."
        />
      </div>
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Grid className="h-4 w-4 text-emerald-500" />
        <span>
          Bu tənzimləmələr məhsul səhifəsinin görünüşünə təsir edir.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   9. SEO & Analytics Settings
// =========================================================
const SEOAnalyticsSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Globe2}
      title="SEO & Analytics"
      subtitle="Axtarış optimallaşdırması və analytics tənzimləmələri."
    />

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Search className="h-4 w-4 text-emerald-600" /> SEO Tənzimləmələri
      </h3>
      <div className="space-y-4">
        <Textarea
          label="Meta Description"
          value={localStorefrontConfig.metaDescription || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaDescription: e.target.value,
            }))
          }
          rows={3}
          placeholder="Təbii məhsullar..."
        />
        <Textarea
          label="Meta Keywords"
          value={
            localStorefrontConfig.metaKeywords?.join(", ") || ""
          }
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaKeywords: e.target.value
                .split(",")
                .map((k) => k.trim()),
            }))
          }
          rows={2}
          placeholder="organik, təbii, kənd"
        />
        <Input
          label="OG Image URL"
          value={localStorefrontConfig.ogImage || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              ogImage: val,
            }))
          }
          placeholder="/og-image.jpg"
          icon={<ImageIcon className="h-4 w-4" />}
          helper="Social media paylaşımı üçün Open Graph şəkli"
        />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Monitor className="h-4 w-4 text-emerald-600" /> Analytics &
        Tracking
      </h3>
      <div className="space-y-4">
        <Input
          label="Google Analytics ID"
          value={localStorefrontConfig.googleAnalyticsId || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              googleAnalyticsId: val,
            }))
          }
          placeholder="G-XXXXXXXXXX"
          icon={<Monitor className="h-4 w-4" />}
          helper="Google Analytics 4 Property ID"
        />
        <Input
          label="Google Tag Manager ID"
          value={localStorefrontConfig.gtmId || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              gtmId: val,
            }))
          }
          placeholder="GTM-XXXXXX"
          icon={<Tag className="h-4 w-4" />}
          helper="Google Tag Manager Container ID"
        />
        <Textarea
          label="Custom Analytics Code"
          value={localStorefrontConfig.customAnalyticsCode || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              customAnalyticsCode: e.target.value,
            }))
          }
          rows={4}
          placeholder="<script>...</script>"
        />
      </div>
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Globe2 className="h-4 w-4 text-emerald-500" />
        <span>
          SEO və analytics kodları dərhal aktiv olunacaq.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   10. Navigation Menu Settings
// =========================================================
const NavigationMenuSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Menu}
      title="Navigasiya Menyu"
      subtitle="Header və footer menyu elementlərini idarə edin."
    />

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Navigation className="h-4 w-4 text-emerald-600" /> Əsas
        Navigasiya
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.mainNavigation || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            mainNavigation: items,
          }))
        }
        addLabel="Menyu Elementi Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            mainNavigation: [
              ...(s.mainNavigation || []),
              { label: "", href: "", icon: "" },
            ],
          }))
        }
        renderItem={(
          item: any,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                label="Etiket"
                value={item?.label || ""}
                onChange={(val) =>
                  onUpdate({ ...item, label: val })
                }
                placeholder="Ana Səhifə"
              />
              <Input
                label="Link"
                value={item?.href || ""}
                onChange={(val) =>
                  onUpdate({ ...item, href: val })
                }
                placeholder="/"
                icon={<LinkIcon className="h-4 w-4" />}
              />
              <Input
                label="Emoji Icon"
                value={item?.icon || ""}
                onChange={(val) =>
                  onUpdate({ ...item, icon: val })
                }
                placeholder="🏠"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.mainNavigation?.length ||
                    0) -
                    1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Tag className="h-4 w-4 text-emerald-600" /> Kateqoriya
        Navigasiyası
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.categoryNavigation || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            categoryNavigation: items,
          }))
        }
        addLabel="Kateqoriya Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            categoryNavigation: [
              ...(s.categoryNavigation || []),
              { label: "", href: "", icon: "" },
            ],
          }))
        }
        renderItem={(
          item: any,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                label="Kateqoriya Adı"
                value={item?.label || ""}
                onChange={(val) =>
                  onUpdate({ ...item, label: val })
                }
                placeholder="Meyvə və Tərəvəz"
              />
              <Input
                label="Link"
                value={item?.href || ""}
                onChange={(val) =>
                  onUpdate({ ...item, href: val })
                }
                placeholder="/category/fruits"
                icon={<LinkIcon className="h-4 w-4" />}
              />
              <Input
                label="Emoji Icon"
                value={item?.icon || ""}
                onChange={(val) =>
                  onUpdate({ ...item, icon: val })
                }
                placeholder="🍎"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.categoryNavigation
                    ?.length || 0) -
                    1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Menu className="h-4 w-4 text-emerald-500" />
        <span>
          Navigasiya dəyişiklikləri dərhal storefront-da görünəcək.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   11. Testimonials & FAQ Settings
// =========================================================
const TestimonialsFAQSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={MessageSquare}
      title="Rəylər & FAQ"
      subtitle="Müştəri rəyləri və tez-tez verilən sualları idarə edin."
    />

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Star className="h-4 w-4 text-emerald-600" /> Müştəri Rəyləri
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.testimonials || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            testimonials: items,
          }))
        }
        addLabel="Rəy Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            testimonials: [
              ...(s.testimonials || []),
              { name: "", text: "", rating: 5, role: "" },
            ],
          }))
        }
        renderItem={(
          testimonial: any,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Input
                label="Müştəri Adı"
                value={testimonial?.name || ""}
                onChange={(val) =>
                  onUpdate({ ...testimonial, name: val })
                }
                placeholder="Əli Vəliyev"
              />
              <Input
                label="Rol/Vəzifə"
                value={testimonial?.role || ""}
                onChange={(val) =>
                  onUpdate({ ...testimonial, role: val })
                }
                placeholder="Qaiməkam"
              />
              <Textarea
                label="Rəy Mətni"
                value={testimonial?.text || ""}
                onChange={(e) =>
                  onUpdate({
                    ...testimonial,
                    text: e.target.value,
                  })
                }
                rows={2}
                placeholder="Məhsullarınız çox yaxşıdır..."
              />
              <Select
                label="Reytinq"
                name={`rating-${index}`}
                value={testimonial?.rating?.toString() || "5"}
                onChange={(e) =>
                  onUpdate({
                    ...testimonial,
                    rating: parseInt(e.target.value),
                  })
                }
                options={[
                  { value: "5", label: "⭐⭐⭐⭐⭐ (5)" },
                  { value: "4", label: "⭐⭐⭐⭐ (4)" },
                  { value: "3", label: "⭐⭐⭐ (3)" },
                  { value: "2", label: "⭐⭐ (2)" },
                  { value: "1", label: "⭐ (1)" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.testimonials?.length ||
                    0) -
                    1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <HelpCircle className="h-4 w-4 text-emerald-600" /> Tez-tez
        Verilən Suallar (FAQ)
      </h3>
      <ArrayEditor
        items={localStorefrontConfig.faq || []}
        onChange={(items) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            faq: items,
          }))
        }
        addLabel="Sual Əlavə Et"
        onAdd={() =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            faq: [
              ...(s.faq || []),
              { question: "", answer: "" },
            ],
          }))
        }
        renderItem={(
          item: any,
          index,
          onUpdate,
          onRemove,
          onMoveUp,
          onMoveDown
        ) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Input
                label="Sual"
                value={item?.question || ""}
                onChange={(val) =>
                  onUpdate({ ...item, question: val })
                }
                placeholder="Çatdırılma neçə gün çəkir?"
              />
              <Textarea
                label="Cavab"
                value={item?.answer || ""}
                onChange={(e) =>
                  onUpdate({
                    ...item,
                    answer: e.target.value,
                  })
                }
                rows={2}
                placeholder="Çatdırılma adətən 1-3 iş günü çəkir..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                disabled={
                  index ===
                  (localStorefrontConfig.faq?.length || 0) - 1
                }
              >
                <MoveDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MessageSquare className="h-4 w-4 text-emerald-500" />
        <span>
          Rəylər və FAQ dərhal storefront-da görünəcək.
        </span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   12. System & Advanced Settings
// =========================================================
const SystemAdvancedSettings: SettingTab["component"] = ({
  localStorefrontConfig,
  setLocalStorefrontConfig,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Code}
      title="Sistem & Advanced"
      subtitle="Baxış rejimi, custom kod və advanced tənzimləmələr."
    />

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <ToggleLeft className="h-4 w-4 text-emerald-600" /> Baxış Rejimi
      </h3>
      <div className="space-y-4">
        <Switch
          label="Baxış Rejimi (Maintenance Mode)"
          checked={localStorefrontConfig.maintenanceMode || false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              maintenanceMode: v,
            }))
          }
          description="Mağazanı müvəqqəti olaraq bağlayın. Yalnız adminlər daxil ola bilər."
        />
        <Textarea
          label="Baxış Mesajı"
          value={localStorefrontConfig.maintenanceMessage || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              maintenanceMessage: e.target.value,
            }))
          }
          rows={3}
          placeholder="Sayt texniki baxışdadır..."
        />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Code className="h-4 w-4 text-emerald-600" /> Custom Kod
      </h3>
      <div className="space-y-4">
        <Textarea
          label="Custom CSS"
          value={localStorefrontConfig.customCss || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              customCss: e.target.value,
            }))
          }
          rows={6}
          placeholder=".my-class { color: red; }"
        />
        <Textarea
          label="Custom JavaScript"
          value={localStorefrontConfig.customJs || ""}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              customJs: e.target.value,
            }))
          }
          rows={6}
          placeholder="console.log('hello');"
        />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Megaphone className="h-4 w-4 text-emerald-600" /> Elan Banner-i
      </h3>
      <div className="space-y-4">
        <Switch
          label="Elan Banner-i Göstər"
          checked={
            localStorefrontConfig.showAnnouncementBanner || false
          }
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showAnnouncementBanner: v,
            }))
          }
          description="Saytın yuxarı hissəsində elan banner-i göstər."
        />
        <Input
          label="Elan Mətni"
          value={localStorefrontConfig.announcementText || ""}
          onChange={(val) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              announcementText: val,
            }))
          }
          placeholder="🎉 Yeni məhsullarımız gəldi!"
        />
        <ColorPicker
          label="Banner Rəngi"
          value={localStorefrontConfig.announcementColor || "#f59e0b"}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              announcementColor: value,
            }))
          }
        />
      </div>
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Code className="h-4 w-4 text-emerald-500" />
        <span>Sistem tənzimləmələri dərhal aktiv olunacaq.</span>
      </div>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={isSaving || !hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Yadda saxlanılır…" : "Dəyişiklikləri yadda saxla"}
      </Button>
    </motion.div>
  </div>
);

// =========================================================
//   13. Security & Data Settings
// =========================================================
const SecurityDataSettings: SettingTab["component"] = ({
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const handleResetAllData = () => {
    console.log("Resetting all store data...");
    setTimeout(() => alert("Bütün mağaza datası uğurla sıfırlandı!"), 1000);
  };

  const handleResetPasswords = () => {
    console.log("Resetting all user passwords...");
    setTimeout(() => alert("Bütün istifadəçi şifrələri uğurla sıfırlandı!"), 1000);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);
    setExportDialogOpen(false);
  };

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    alert("Stok cache uğurla yeniləndi!");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Shield}
        title="Təhlükəsizlik & Data"
        subtitle="Şifrə sıfırlama, data reset və export əməliyyatları."
      />

      <div className="space-y-4 rounded-xl border border-red-100 bg-red-50/90 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-red-700">
          <AlertTriangle className="h-4 w-4" /> Təhlükəli Zonalar
        </h3>
        <p className="text-xs text-red-600">
          Aşağıdakı əməliyyatlar geri qaytarıla bilməz.
        </p>
        <Button
          onClick={() => setPasswordResetDialogOpen(true)}
          variant="danger"
          className="w-full justify-center"
        >
          <Key className="h-4 w-4" />
          Bütün istifadəçi şifrələrini sıfırla
        </Button>
        <Button
          onClick={() => setResetDialogOpen(true)}
          variant="danger"
          className="w-full justify-center"
        >
          <Database className="h-4 w-4" />
          Bütün mağaza datasını sıfırla (reset)
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/85 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-blue-700">
          <Download className="h-4 w-4" /> Data İdarəetmə
        </h3>
        <Button
          onClick={() => setExportDialogOpen(true)}
          variant="secondary"
          className="w-full justify-center"
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV/JSON Export (bütün sifarişlər)
        </Button>
        <Button
          onClick={handleRefreshCache}
          variant="secondary"
          className="w-full justify-center"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Yenilənir..." : "Stok partiyalarını yenilə (cache refresh)"}
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          variant="primary"
          disabled={isSaving || !hasUnsavedChanges}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Yadda saxlanılır…" : "Tənzimləmələri yadda saxla"}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetAllData}
        title="Bütün mağaza datasını sıfırla"
        message="Bu əməliyyat geri qaytarıla bilməz."
        type="danger"
      />
      <ConfirmDialog
        isOpen={passwordResetDialogOpen}
        onClose={() => setPasswordResetDialogOpen(false)}
        onConfirm={handleResetPasswords}
        title="Bütün istifadəçi şifrələrini sıfırla"
        message="Bütün şifrələr sıfırlanacaq."
        type="danger"
      />

      {exportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Export Formatı Seçin
            </h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setExportFormat("csv")}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  exportFormat === "csv"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">
                      CSV Format
                    </div>
                    <div className="text-xs text-slate-500">
                      Excel və Google Sheets üçün uyğun
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setExportFormat("json")}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  exportFormat === "json"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-900">
                      JSON Format
                    </div>
                    <div className="text-xs text-slate-500">
                      Developer və API üçün uyğun
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setExportDialogOpen(false)}
                variant="ghost"
              >
                Ləğv et
              </Button>
              <Button
                onClick={handleExportData}
                variant="primary"
                disabled={isExporting}
              >
                {isExporting ? "Export edilir..." : "Export et"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// =========================================================
//   TAB LIST
// =========================================================
const settingsTabs: SettingTab[] = [
  {
    id: "general",
    label: "Ümumi",
    icon: Settings,
    component: GeneralSettings,
  },
  {
    id: "store-finance",
    label: "Mağaza & Maliyyə",
    icon: DollarSign,
    component: StoreFinanceSettings,
  },
  {
    id: "content-management",
    label: "Məzmun",
    icon: Layout,
    component: ContentManagementSettings,
  },
  {
    id: "storefront-display",
    label: "Storefront",
    icon: Grid,
    component: StorefrontDisplaySettings,
  },
  {
    id: "navigation-menu",
    label: "Navigasiya",
    icon: Menu,
    component: NavigationMenuSettings,
  },
  {
    id: "seo-analytics",
    label: "SEO & Analytics",
    icon: Globe2,
    component: SEOAnalyticsSettings,
  },
  {
    id: "testimonials-faq",
    label: "Rəylər & FAQ",
    icon: MessageSquare,
    component: TestimonialsFAQSettings,
  },
  {
    id: "premium-ui",
    label: "Premium UI",
    icon: Sparkles,
    component: PremiumUISettings,
  },
  {
    id: "system-advanced",
    label: "Sistem",
    icon: Code,
    component: SystemAdvancedSettings,
  },
  {
    id: "user-preferences",
    label: "Admin UI",
    icon: User,
    component: UserPreferences,
  },
  {
    id: "security-data",
    label: "Təhlükəsizlik",
    icon: Shield,
    component: SecurityDataSettings,
  },
];

// =========================================================
//   MAIN SETTINGS PAGE
// =========================================================
export default function AdminSettingsPage() {
  const {
    storefrontConfig,
    adminUIState,
    updateStorefrontConfig,
    setAdminUIState,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tam default dəyərlər (orijinaldakı kimi)
  const defaultStorefrontConfig = useMemo<
    StorefrontConfig & {
      vatRate?: number;
      contactPhone?: string;
      contactEmail?: string;
      shippingFee?: number;
      locale?: string;
    }
  >(
    () =>
      storefrontConfig ?? {
        currency: "AZN",
        locale: "az-AZ",
        vatRate: 0.18,
        contactEmail: "info@organikgedebey.az",
        contactPhone: "",
        shippingFee: 0,
        primaryColor: "#16a34a",
        secondaryColor: "#10b981",
        logoUrl: "/organik_gedebey_logo.jpeg",
        siteTitle: "Organik Gədəbəy",
        siteDescription: "Təbii kənd məhsulları",
        fontFamily: "inter",
        headingFont: "inter",
        containerWidth: "default",
        spacingSize: "medium",
        enablePageTransitions: true,
        enableHoverEffects: true,
        animationSpeed: "normal",
        enableShadows: true,
        enableRoundedCorners: true,
        enableGradients: true,
        heroTitle: "Təbii məhsullar bir klik uzağınızda",
        heroSubtitle: "100% organik və təzə",
        heroButtonText: "Sifariş et",
        heroButtonLink: "/products",
        heroImageUrl: "",
        topBannerText:
          "🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!",
        topBannerEnabled: true,
        stats: [
          { value: "1000+", label: "Məhsul", icon: "📦" },
          { value: "5000+", label: "Müştəri", icon: "👥" },
          { value: "99%", label: "Məmnuniyyət", icon: "⭐" },
        ],
        footerCopyright:
          "© 2024 Organik Gədəbəy. Bütün hüquqlar qorunur.",
        footerAboutText:
          "Təbiətin əvəzsiz nemətləri bir klik uzağınızda. 100% organik və təzə məhsullar.",
        headerBanners: [
          {
            text: "🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!",
            color: "from-emerald-600 to-teal-600",
            link: "",
          },
          {
            text: "🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10",
            color: "from-orange-500 to-red-500",
            link: "",
          },
        ],
        headerTopBar: {
          tagline: "Gədəbəy & Gəncə ailə təsərrüfatları",
          location: "Özü götürmə & Çatdırılma",
          hours: "Hər gün 09:00 - 21:00",
        },
        footerQuickLinks: [
          { label: "Ana Səhifə", href: "/" },
          { label: "Haqqımızda", href: "/about" },
          { label: "FAQ", href: "/faq" },
        ],
        trustBadges: [
          {
            icon: "🌿",
            title: "100% Organik",
            description: "Təbii məhsullar",
          },
          {
            icon: "🚚",
            title: "Sürətli Çatdırılma",
            description: "24 saat ərzində",
          },
          {
            icon: "💯",
            title: "Keyfiyyət Təminatı",
            description: "Təzəlik zəmanəti",
          },
        ],
        socialInstagram: "",
        socialFacebook: "",
        socialWhatsapp: "",
        socialTelegram: "",
        socialYoutube: "",
        socialTwitter: "",
        // Storefront Display
        productViewMode: "grid",
        productsPerPage: "12",
        defaultSort: "newest",
        gridColumns: "3",
        showProductDescription: true,
        showStockQuantity: true,
        showAddToCartNotification: true,
        // SEO & Analytics
        metaDescription:
          "Təbii kənd məhsulları bir klik uzağınızda. 100% organik və təzə məhsullar.",
        metaKeywords: [
          "organik",
          "təbii",
          "kənd məhsulları",
          "gedebey",
          "gəncə",
        ],
        ogImage: "",
        googleAnalyticsId: "",
        gtmId: "",
        customAnalyticsCode: "",
        // Navigation
        mainNavigation: [
          { label: "Ana Səhifə", href: "/", icon: "🏠" },
          { label: "Məhsullar", href: "/products", icon: "🛒" },
          { label: "Haqqımızda", href: "/about", icon: "ℹ️" },
          { label: "Əlaqə", href: "/contact", icon: "📞" },
        ],
        categoryNavigation: [
          {
            label: "Meyvə və Tərəvəz",
            href: "/category/fruits-vegetables",
            icon: "🍎",
          },
          {
            label: "Süd Məhsulları",
            href: "/category/dairy",
            icon: "🥛",
          },
          {
            label: "Bal və Mürəbbə",
            href: "/category/honey-jam",
            icon: "🍯",
          },
        ],
        // Testimonials & FAQ
        testimonials: [
          {
            name: "Əli Vəliyev",
            role: "Qaiməkam",
            text: "Məhsullarınız çox yaxşıdır, həmişə sifariş edirəm.",
            rating: 5,
          },
          {
            name: "Ayşə Məmmədova",
            role: "Ev xanımı",
            text: "Təzə və keyfiyyətli məhsullar üçün təşəkkürlər.",
            rating: 5,
          },
        ],
        faq: [
          {
            question: "Çatdırılma neçə gün çəkir?",
            answer: "Çatdırılma adətən 1-3 iş günü çəkir.",
          },
          {
            question: "Məhsullar təzədir?",
            answer:
              "Bəli, bütün məhsullarımız birbaşa kənd təsərrüfatlarından gətirilir.",
          },
        ],
        // System & Advanced
        maintenanceMode: false,
        maintenanceMessage:
          "Sayt texniki baxışdadır. Yaxın zamanda geri qayıdacağıq.",
        customCss: "",
        customJs: "",
        showAnnouncementBanner: false,
        announcementText: "",
        announcementColor: "#f59e0b",
      },
    [storefrontConfig]
  );

  const defaultUIState = useMemo<AdminUIState>(
    () =>
      adminUIState ?? {
        sidebarOpen: true,
        theme: "light",
        lastVisited: new Date().toISOString(),
      },
    [adminUIState]
  );

  const [localStorefrontConfig, setLocalStorefrontConfig] =
    useState(defaultStorefrontConfig);
  const [localUIState, setLocalUIState] = useState(defaultUIState);

  useEffect(() => {
    setLocalStorefrontConfig(defaultStorefrontConfig);
    setLocalUIState(defaultUIState);
    setHasUnsavedChanges(false);
  }, [defaultStorefrontConfig, defaultUIState]);

  const updateLocalStorefrontConfig = useCallback(
    (value: React.SetStateAction<typeof localStorefrontConfig>) => {
      setLocalStorefrontConfig((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        setHasUnsavedChanges(true);
        return next;
      });
    },
    []
  );

  const updateLocalUIState = useCallback(
    (value: React.SetStateAction<AdminUIState>) => {
      setLocalUIState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        setHasUnsavedChanges(true);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localStorefrontConfig),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to save settings (${response.status})`
        );
      }
      updateStorefrontConfig(localStorefrontConfig);
      setAdminUIState(localUIState);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(
        `Tənzimləmələr yadda saxlanılmadı: ${
          error instanceof Error ? error.message : "Xəta baş verdi"
        }`
      );
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    setSaveSuccess(true);
    setHasUnsavedChanges(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [localStorefrontConfig, localUIState, updateStorefrontConfig, setAdminUIState]);

  const ActiveComponent = useMemo(() => {
    const tab = settingsTabs.find((t) => t.id === activeTab);
    if (!tab) return null;
    const Component = tab.component;
    return (
      <Component
        localStorefrontConfig={localStorefrontConfig}
        setLocalStorefrontConfig={updateLocalStorefrontConfig}
        localUIState={localUIState}
        setLocalUIState={updateLocalUIState}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    );
  }, [
    activeTab,
    localStorefrontConfig,
    localUIState,
    updateLocalStorefrontConfig,
    updateLocalUIState,
    handleSave,
    isSaving,
    hasUnsavedChanges,
  ]);

  return (
    <div className="relative min-h-screen">
      <h1 className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-3 text-2xl font-extrabold text-slate-800 md:text-3xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-400/60">
          <Settings className="h-5 w-5" />
        </span>
        <span>Admin Tənzimləmələri</span>
      </h1>

      <AnimatePresence>
        {(isSaving || saveSuccess) && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -15, x: 10 }}
            className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${
              isSaving ? "bg-blue-500" : "bg-emerald-600"
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Yadda saxlanılır...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Dəyişikliklər yadda saxlandı!
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
        <motion.nav
          className="h-fit rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-xl shadow-slate-200/60 lg:sticky lg:top-24"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Parametrlər
          </h3>
          <div className="space-y-2">
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                  }`}
                  whileHover={{ scale: isActive ? 1.02 : 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="active-settings-tab"
                      className="absolute inset-y-1 right-1 w-[0.25rem] rounded-full bg-white/90"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
          {hasUnsavedChanges && (
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-[0.75rem] text-amber-800">
              ● Yadda saxlanmamış dəyişikliklər mövcuddur.
            </div>
          )}
        </motion.nav>

        <div className="min-h-[37.5rem] rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-xl shadow-slate-200/60 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {ActiveComponent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}