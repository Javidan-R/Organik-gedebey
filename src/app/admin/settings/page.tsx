// src/app/admin/settings/page.tsx
'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

import { useApp } from '@/lib/store';
import type { AdminUIState, StorefrontConfig } from '@/lib/types';

// =========================================================
// SMALL UI ATOMS
// =========================================================

type InputFieldProps = {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number' | 'email' | 'password';
  icon?: React.ElementType;
  placeholder?: string;
  helperText?: string;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  placeholder,
  helperText,
}) => (
  <div className="space-y-[0.25rem]">
    <label className="block text-[0.75rem] font-semibold text-slate-600">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[0.875rem] text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${
          Icon ? 'pl-9' : ''
        }`}
      />
    </div>
    {helperText && (
      <p className="mt-[0.2rem] text-[0.6875rem] text-slate-500">
        {helperText}
      </p>
    )}
  </div>
);

type SwitchToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
};

const SwitchToggle: React.FC<SwitchToggleProps> = ({
  label,
  checked,
  onChange,
  description,
}) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
    <div className="max-w-[70%] space-y-[0.15rem]">
      <p className="text-[0.875rem] font-semibold text-slate-800">
        {label}
      </p>
      <p className="text-[0.75rem] text-slate-500">{description}</p>
    </div>
    <motion.button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      }`}
      role="switch"
      aria-checked={checked}
      whileTap={{ scale: 0.92 }}
    >
      <motion.span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </motion.button>
  </div>
);

type ButtonColor = 'emerald' | 'blue' | 'red' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ElementType;
  color?: ButtonColor;
  children: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({
  icon: Icon,
  color = 'emerald',
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-lg';

  let colorClasses = '';
  switch (color) {
    case 'emerald':
      colorClasses =
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30';
      break;
    case 'blue':
      colorClasses =
        'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30';
      break;
    case 'red':
      colorClasses =
        'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30';
      break;
    case 'ghost':
      colorClasses =
        'bg-white/70 text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-none';
      break;
  }

  return (
    <motion.button
      className={`${baseClasses} ${colorClasses} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      {...(props as any)}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </motion.button>
  );
};

// Sadə section başlığı (reusable)
const SectionHeader: React.FC<{ icon?: React.ElementType; title: string; subtitle?: string }> = ({
  icon: Icon,
  title,
  subtitle,
}) => (
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
      <h2 className="text-2xl font-extrabold text-slate-900">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-[2px]">{subtitle}</p>
      )}
    </div>
  </motion.div>
);

// Sticky bottom bar (General tab üçün istifadə olunur)
type StickyActionBarProps = {
  leftContent?: React.ReactNode;
  children?: React.ReactNode;
};

const StickyActionBar: React.FC<StickyActionBarProps> = ({
  leftContent,
  children,
}) => (
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

// Array editor component for managing lists
type ArrayEditorProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onUpdate: (item: T) => void, onRemove: () => void, onMoveUp: () => void, onMoveDown: () => void) => React.ReactNode;
  addLabel: string;
  onAdd: () => void;
};

const ArrayEditor = <T,>({ items, onChange, renderItem, addLabel, onAdd }: ArrayEditorProps<T>) => (
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
              [newItems[index - 1]!, newItems[index]!] = [newItems[index]!, newItems[index - 1]!];
              onChange(newItems);
            }
          },
          () => {
            if (index < items.length - 1) {
              const newItems = [...items] as T[];
              [newItems[index]!, newItems[index + 1]!] = [newItems[index + 1]!, newItems[index]!];
              onChange(newItems);
            }
          }
        )}
      </div>
    ))}
    <Button
      onClick={onAdd}
      icon={Plus}
      color="ghost"
      className="w-full justify-center border-dashed"
    >
      {addLabel}
    </Button>
  </div>
);

// Textarea field component
type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  helperText?: string;
  placeholder?: string;
};

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  rows = 3,
  helperText,
  placeholder,
}) => (
  <div className="space-y-[0.25rem]">
    <label className="block text-[0.75rem] font-semibold text-slate-600">
      {label}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[0.875rem] text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 resize-none"
    />
    {helperText && (
      <p className="mt-[0.2rem] text-[0.6875rem] text-slate-500">
        {helperText}
      </p>
    )}
  </div>
);

// Color picker component
type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
};

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  helperText,
}) => (
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[0.875rem] text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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

// Select field component
type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helperText?: string;
};

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  helperText,
}) => (
  <div className="space-y-[0.25rem]">
    <label className="block text-[0.75rem] font-semibold text-slate-600">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-10 text-[0.875rem] text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
    {helperText && (
      <p className="mt-[0.2rem] text-[0.6875rem] text-slate-500">
        {helperText}
      </p>
    )}
  </div>
);

// Confirmation dialog component
type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Təsdiqlə',
  cancelText = 'Ləğv et',
  type = 'danger',
}) => {
  if (!isOpen) return null;

  const typeColors = {
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/30',
    warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30',
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
          <Button onClick={onClose} color="ghost">
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            color={type === 'danger' ? 'red' : type === 'warning' ? 'emerald' : 'blue'}
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
// SETTINGS PAGES/TABS
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
      // Storefront Display
      productViewMode?: string;
      productsPerPage?: string;
      defaultSort?: string;
      gridColumns?: string;
      showProductDescription?: boolean;
      showStockQuantity?: boolean;
      showAddToCartNotification?: boolean;
      // SEO & Analytics
      metaDescription?: string;
      metaKeywords?: string[];
      ogImage?: string;
      googleAnalyticsId?: string;
      gtmId?: string;
      customAnalyticsCode?: string;
      // Navigation
      mainNavigation?: Array<{ label: string; href: string; icon: string }>;
      categoryNavigation?: Array<{ label: string; href: string; icon: string }>;
      // Testimonials & FAQ
      testimonials?: Array<{ name: string; role?: string; text: string; rating: number }>;
      faq?: Array<{ question: string; answer: string }>;
      // System & Advanced
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
          mainNavigation?: Array<{ label: string; href: string; icon: string }>;
          categoryNavigation?: Array<{ label: string; href: string; icon: string }>;
          testimonials?: Array<{ name: string; role?: string; text: string; rating: number }>;
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

// ---------------------------------------------------------
// 1. General Settings
// ---------------------------------------------------------
const GeneralSettings: SettingTab['component'] = ({
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
      <InputField
        label="Əlaqə E-poçtu"
        type="email"
        icon={Mail}
        value={localStorefrontConfig.contactEmail || ''}
        onChange={(e) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            contactEmail: e.target.value,
          }))
        }
        placeholder="info@organikgedebey.az"
      />
      <InputField
        label="Əlaqə Nömrəsi"
        type="text"
        icon={Phone}
        value={localStorefrontConfig.contactPhone || ''}
        onChange={(e) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            contactPhone: e.target.value,
          }))
        }
        placeholder="+994 50 XXX XX XX"
      />
      <InputField
        label="Mağaza Lokalı (Dil)"
        type="text"
        icon={Globe}
        value={localStorefrontConfig.locale || 'az-AZ'}
        onChange={(e) =>
          setLocalStorefrontConfig((s) => ({ ...s, locale: e.target.value }))
        }
        helperText="Format: en-US, az-AZ, tr-TR. Tarix və pul formatına təsir edir."
      />
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">
          Əsas Valyuta
        </label>
        <select
          value={localStorefrontConfig.currency || 'AZN'}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              currency: e.target.value as StorefrontConfig['currency'],
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

    {/* Locale & Currency preview mini card */}
    <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600 flex items-start gap-2">
      <Info className="h-4 w-4 text-emerald-500 mt-[2px]" />
      <div>
        <div className="font-semibold mb-[2px]">Canlı ön-baxış</div>
        <p>
          Dil: <span className="font-medium">
            {localStorefrontConfig.locale || 'az-AZ'}
          </span>{' '}
          — Valyuta: <span className="font-medium">
            {localStorefrontConfig.currency || 'AZN'}
          </span>
        </p>
        <p className="mt-[2px]">
          Məs: məhsul qiyməti <span className="font-semibold">12.50</span> →{' '}
          <span className="font-semibold">
            {localStorefrontConfig.currency === 'USD'
              ? '$12.50'
              : localStorefrontConfig.currency === 'EUR'
              ? '€12.50'
              : '12.50 ₼'}
          </span>
        </p>
      </div>
    </div>

    <StickyActionBar
      leftContent={
        <>
          <Eye className="h-4 w-4 text-emerald-500" />
          <span>
            Dəyişikliklər admin panelinə və storefront görünüşünə təsir edəcək.
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </StickyActionBar>
  </div>
);

// ---------------------------------------------------------
// 2. Storefront & Finance Settings
// ---------------------------------------------------------
const StoreFinanceSettings: SettingTab['component'] = ({
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
      <InputField
        label="ƏDV Dərəcəsi (Vergi)"
        type="number"
        icon={Percent}
        value={localStorefrontConfig.vatRate ?? 0}
        onChange={(e) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            vatRate: parseFloat(e.target.value || '0'),
          }))
        }
        placeholder="0.18"
        helperText="0.18 = 18%. Bütün qiymətlərə tətbiq olunur."
      />
      <InputField
        label="Standart Çatdırılma Haqqı"
        type="number"
        icon={Truck}
        value={localStorefrontConfig.shippingFee ?? 0}
        onChange={(e) =>
          setLocalStorefrontConfig((s) => ({
            ...s,
            shippingFee: parseFloat(e.target.value || '0'),
          }))
        }
        placeholder="5.00"
        helperText="0.00 olarsa pulsuz çatdırılma deməkdir."
      />
    </div>

    <div className="mt-4 space-y-4">
      <SwitchToggle
        label="Anında Ödəniş Bildirişləri"
        checked={true}
        onChange={() =>
          alert(
            'Bu funksiya üçün Real-Time backend (WebSocket və ya Push Notification) lazımdır.',
          )
        }
        description="Yeni sifarişlər zamanı administratorlara anında bildiriş göndərilsin (məs. mobil push və ya web notification)."
      />

      <SwitchToggle
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
          Vergi və çatdırılma nizamları checkout hesablamalarına birbaşa təsir
          edir.
        </span>
      </div>
      <Button
        onClick={onSave}
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 3. User Preferences (AdminUIState)
// ---------------------------------------------------------
const UserPreferences: SettingTab['component'] = ({
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
      <SwitchToggle
        label="Sidebar-ı həmişə açıq saxla"
        checked={localUIState.sidebarOpen}
        onChange={(v) =>
          setLocalUIState((s) => ({
            ...s,
            sidebarOpen: v,
          }))
        }
        description="Sidebar-ı mobil və ya tablet rejimində belə geniş açıq saxla. Çox işlədiyin ekranlar üçün ideal."
      />

      <SwitchToggle
        label="Tünd Tema (Dark Mode)"
        checked={localUIState.theme === 'dark'}
        onChange={(v) =>
          setLocalUIState((s) => ({
            ...s,
            theme: v ? 'dark' : 'light',
          }))
        }
        description="Admin panelini gecə rejiminə uyğunlaşdır (xüsusilə uzun iş saatları üçün göz yorğunluğunu azaldır)."
      />

      <SwitchToggle
        label="Səhifə Keçidlərini Animasiya Et"
        checked={true}
        onChange={() => {}}
        description="`framer-motion` ilə səhifələr arasında keçid animasiyalarını aktiv saxla (premium hiss üçün)."
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 4. Content Management Settings
// ---------------------------------------------------------
const ContentManagementSettings: SettingTab['component'] = ({
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
          value={localStorefrontConfig.primaryColor || '#16a34a'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              primaryColor: value,
            }))
          }
          helperText="Düymələr, linklər və vurğular üçün istifadə olunur"
        />
        <ColorPicker
          label="İkinci Rəng"
          value={localStorefrontConfig.secondaryColor || '#10b981'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              secondaryColor: value,
            }))
          }
          helperText="Arxa plan və ikinci elementlər üçün"
        />
        <InputField
          label="Sayt Başlığı"
          value={localStorefrontConfig.siteTitle || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              siteTitle: e.target.value,
            }))
          }
          placeholder="Organik Gədəbəy"
        />
        <InputField
          label="Sayt Təsviri"
          value={localStorefrontConfig.siteDescription || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              siteDescription: e.target.value,
            }))
          }
          placeholder="Təbii kənd məhsulları"
          helperText="SEO üçün meta description"
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
            <h3 className="text-sm font-bold text-slate-800">Hero Bölməsi</h3>
            <p className="text-xs text-slate-500">Ana səhifənin görünüşünü idarə edin</p>
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
        <InputField
          label="Logo URL"
          value={localStorefrontConfig.logoUrl || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              logoUrl: e.target.value,
            }))
          }
          placeholder="/logo.png"
          icon={ImageIcon}
          helperText="Saytınızın loqosu"
        />
        <InputField
          label="Favicon URL"
          value={localStorefrontConfig.faviconUrl || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              faviconUrl: e.target.value,
            }))
          }
          placeholder="/favicon.ico"
          icon={ImageIcon}
          helperText="Brauzer tab ikonu"
        />
      </div>
    </div>

    {/* Navigation Links */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Navigation className="h-4 w-4 text-emerald-600" /> Naviqasiya Linkləri
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
              { label: '', href: '', icon: '' },
            ],
          }))
        }
        renderItem={(item, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <InputField
                label={`Link ${index + 1} Adı`}
                value={item.label}
                onChange={(e) => onUpdate({ ...item, label: e.target.value })}
                placeholder="Məhsullar"
              />
              <InputField
                label={`Link ${index + 1} URL`}
                value={item.href}
                onChange={(e) => onUpdate({ ...item, href: e.target.value })}
                placeholder="/products"
                icon={LinkIcon}
              />
              <InputField
                label={`Link ${index + 1} İkon`}
                value={item.icon || ''}
                onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
                placeholder="package"
                helperText="Lucide icon adı"
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
                disabled={index === (localStorefrontConfig.navItems?.length || 0) - 1}
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
        <BarChart3 className="h-4 w-4 text-emerald-600" /> Premium SEO (Expert Level)
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Meta Title"
            value={localStorefrontConfig.metaTitle || ''}
            onChange={(e) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                metaTitle: e.target.value,
              }))
            }
            placeholder="Organik Gədəbəy - Təbii Kənd Məhsulları"
            helperText="SEO başlıq (60-60 simvol)"
          />
          <InputField
            label="Canonical URL"
            value={localStorefrontConfig.canonicalUrl || ''}
            onChange={(e) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                canonicalUrl: e.target.value,
              }))
            }
            placeholder="https://organikgedebey.az"
            icon={LinkIcon}
            helperText="Kanonik URL"
          />
        </div>
        <TextAreaField
          label="Meta Description"
          value={localStorefrontConfig.metaDescription || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaDescription: e.target.value,
            }))
          }
          rows={3}
          helperText="SEO təsviri (150-160 simvol)"
        />
        <TextAreaField
          label="Meta Keywords"
          value={localStorefrontConfig.metaKeywords?.join(', ') || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
            }))
          }
          rows={2}
          helperText="Vergüllə ayrılmış açar sözlər"
        />
        <InputField
          label="OG Image"
          value={localStorefrontConfig.ogImage || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              ogImage: e.target.value,
            }))
          }
          placeholder="/og-image.jpg"
          icon={ImageIcon}
          helperText="Open Graph şəkli"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Twitter Card Type"
            value={localStorefrontConfig.twitterCard || 'summary_large_image'}
            onChange={(e) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                twitterCard: e.target.value as any,
              }))
            }
            placeholder="summary_large_image"
            helperText="summary, summary_large_image, app, player"
          />
          <InputField
            label="Twitter Site"
            value={localStorefrontConfig.twitterSite || ''}
            onChange={(e) =>
              setLocalStorefrontConfig((s) => ({
                ...s,
                twitterSite: e.target.value,
              }))
            }
            placeholder="@organikgedebey"
            helperText="Twitter hesab adı"
          />
        </div>
        <TextAreaField
          label="Robots.txt"
          value={localStorefrontConfig.robotsTxt || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              robotsTxt: e.target.value,
            }))
          }
          rows={4}
          helperText="Axtarış botları üçün qaydalar"
        />
        <SwitchToggle
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
        <TextAreaField
          label="Structured Data (JSON-LD)"
          value={localStorefrontConfig.structuredData || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              structuredData: e.target.value,
            }))
          }
          rows={6}
          helperText="JSON-LD formatında strukturlaşdırılmış məlumat"
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
              { text: '', color: 'from-emerald-600 to-teal-600', link: '' },
            ],
          }))
        }
        renderItem={(banner, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <InputField
                label={`Banner ${index + 1} Mətni`}
                value={banner.text}
                onChange={(e) => onUpdate({ ...banner, text: e.target.value })}
                placeholder="🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!"
              />
              <InputField
                label={`Banner ${index + 1} Rəngi`}
                value={banner.color}
                onChange={(e) => onUpdate({ ...banner, color: e.target.value })}
                placeholder="from-emerald-600 to-teal-600"
                helperText="Tailwind gradient class-ları"
              />
              <InputField
                label={`Banner ${index + 1} Linki`}
                value={banner.link || ''}
                onChange={(e) => onUpdate({ ...banner, link: e.target.value })}
                placeholder="/products"
                icon={LinkIcon}
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
                disabled={index === (localStorefrontConfig.headerBanners?.length || 0) - 1}
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
        <Navigation className="h-4 w-4 text-emerald-600" /> Header Top Bar
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InputField
          label="Şüar"
          value={localStorefrontConfig.headerTopBar?.tagline || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headerTopBar: { ...s.headerTopBar, tagline: e.target.value },
            }))
          }
          placeholder="Gədəbəy & Gəncə ailə təsərrüfatları"
        />
        <InputField
          label="Məkan"
          value={localStorefrontConfig.headerTopBar?.location || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headerTopBar: { ...s.headerTopBar, location: e.target.value },
            }))
          }
          placeholder="Özü götürmə & Çatdırılma"
        />
        <InputField
          label="İş Saatları"
          value={localStorefrontConfig.headerTopBar?.hours || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headerTopBar: { ...s.headerTopBar, hours: e.target.value },
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
        <TextAreaField
          label="Haqqında Mətni"
          value={localStorefrontConfig.footerAboutText || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              footerAboutText: e.target.value,
            }))
          }
          rows={3}
          helperText="Footer-da görünən qısa təsvir"
        />
        <InputField
          label="Copyright Mətni"
          value={localStorefrontConfig.footerCopyright || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              footerCopyright: e.target.value,
            }))
          }
          placeholder="© 2024 Organik Gədəbəy. Bütün hüquqlar qorunur."
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
                  { label: '', href: '' },
                ],
              }))
            }
            renderItem={(link: any, _index, onUpdate, onRemove) => (
              <div className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <InputField
                    label="Etiket"
                    value={link?.label || ''}
                    onChange={(e) => onUpdate({ ...link, label: e.target.value })}
                    placeholder="Ana Səhifə"
                  />
                  <InputField
                    label="Link"
                    value={link?.href || ''}
                    onChange={(e) => onUpdate({ ...link, href: e.target.value })}
                    placeholder="/"
                    icon={LinkIcon}
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
        <InputField
          label="Instagram"
          value={localStorefrontConfig.socialInstagram || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialInstagram: e.target.value,
            }))
          }
          placeholder="https://instagram.com/organikgedebey"
          icon={LinkIcon}
        />
        <InputField
          label="Facebook"
          value={localStorefrontConfig.socialFacebook || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialFacebook: e.target.value,
            }))
          }
          placeholder="https://facebook.com/organikgedebey"
          icon={LinkIcon}
        />
        <InputField
          label="WhatsApp"
          value={localStorefrontConfig.socialWhatsapp || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialWhatsapp: e.target.value,
            }))
          }
          placeholder="+994501234567"
          icon={Phone}
        />
        <InputField
          label="Telegram"
          value={localStorefrontConfig.socialTelegram || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialTelegram: e.target.value,
            }))
          }
          placeholder="https://t.me/organikgedebey"
          icon={LinkIcon}
        />
        <InputField
          label="YouTube"
          value={localStorefrontConfig.socialYoutube || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialYoutube: e.target.value,
            }))
          }
          placeholder="https://youtube.com/@organikgedebey"
          icon={LinkIcon}
        />
        <InputField
          label="Twitter/X"
          value={localStorefrontConfig.socialTwitter || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              socialTwitter: e.target.value,
            }))
          }
          placeholder="https://twitter.com/organikgedebey"
          icon={LinkIcon}
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
              { value: '', label: '', icon: '📊' },
            ],
          }))
        }
        renderItem={(stat: any, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <InputField
                label="Qiymət"
                value={stat?.value || ''}
                onChange={(e) => onUpdate({ ...stat, value: e.target.value })}
                placeholder="1000+"
              />
              <InputField
                label="Etiket"
                value={stat?.label || ''}
                onChange={(e) => onUpdate({ ...stat, label: e.target.value })}
                placeholder="Məhsul"
              />
              <InputField
                label="Emoji"
                value={stat?.icon || ''}
                onChange={(e) => onUpdate({ ...stat, icon: e.target.value })}
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
                disabled={index === (localStorefrontConfig.stats?.length || 0) - 1}
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
              { icon: '✓', title: '', description: '' },
            ],
          }))
        }
        renderItem={(badge: any, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <InputField
                label="Emoji"
                value={badge?.icon || ''}
                onChange={(e) => onUpdate({ ...badge, icon: e.target.value })}
                placeholder="🌿"
              />
              <InputField
                label="Başlıq"
                value={badge?.title || ''}
                onChange={(e) => onUpdate({ ...badge, title: e.target.value })}
                placeholder="100% Organik"
              />
              <InputField
                label="Təsvir"
                value={badge?.description || ''}
                onChange={(e) => onUpdate({ ...badge, description: e.target.value })}
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
                disabled={index === (localStorefrontConfig.trustBadges?.length || 0) - 1}
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 6. Premium UI Settings
// ---------------------------------------------------------
const PremiumUISettings: SettingTab['component'] = ({
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
        <SelectField
          label="Əsas Şrift"
          value={localStorefrontConfig.fontFamily || 'inter'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              fontFamily: value,
            }))
          }
          options={[
            { value: 'inter', label: 'Inter (Default)' },
            { value: 'roboto', label: 'Roboto' },
            { value: 'open-sans', label: 'Open Sans' },
            { value: 'poppins', label: 'Poppins' },
            { value: 'montserrat', label: 'Montserrat' },
          ]}
          helperText="Bütün mətnlər üçün default şrift"
        />
        <SelectField
          label="Başlıq Şrifti"
          value={localStorefrontConfig.headingFont || 'inter'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              headingFont: value,
            }))
          }
          options={[
            { value: 'inter', label: 'Inter (Default)' },
            { value: 'roboto', label: 'Roboto' },
            { value: 'open-sans', label: 'Open Sans' },
            { value: 'poppins', label: 'Poppins' },
            { value: 'montserrat', label: 'Montserrat' },
          ]}
          helperText="Başlıqlar üçün şrift"
        />
      </div>
    </div>

    {/* Spacing & Layout */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Layers className="h-4 w-4 text-emerald-600" /> Spacing & Layout
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Konteyner Genişliyi"
          value={localStorefrontConfig.containerWidth || 'default'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              containerWidth: value as 'narrow' | 'default' | 'wide' | 'full',
            }))
          }
          options={[
            { value: 'narrow', label: 'Dar (1024px)' },
            { value: 'default', label: 'Default (1280px)' },
            { value: 'wide', label: 'Geniş (1440px)' },
            { value: 'full', label: 'Tam Genişlik' },
          ]}
          helperText="Məzmun konteynerinin maksimum genişliyi"
        />
        <SelectField
          label="Boşluq Ölçüsü"
          value={localStorefrontConfig.spacingSize || 'medium'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              spacingSize: value as 'compact' | 'medium' | 'relaxed' | 'spacious',
            }))
          }
          options={[
            { value: 'compact', label: 'Sıx (Compact)' },
            { value: 'medium', label: 'Orta (Medium)' },
            { value: 'relaxed', label: 'Geniş (Relaxed)' },
            { value: 'spacious', label: 'Çox Geniş (Spacious)' },
          ]}
          helperText="Elementlər arası boşluq miqdarı"
        />
      </div>
    </div>

    {/* Animations */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Zap className="h-4 w-4 text-emerald-600" /> Animasiyalar
      </h3>
      <div className="space-y-4">
        <SwitchToggle
          label="Səhifə Keçidlərini Animasiya Et"
          checked={localStorefrontConfig.enablePageTransitions !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enablePageTransitions: v,
            }))
          }
          description="Səhifələr arasında yumşaq keçid animasiyalarını aktiv edin."
        />
        <SwitchToggle
          label="Hover Animasiyaları"
          checked={localStorefrontConfig.enableHoverEffects !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enableHoverEffects: v,
            }))
          }
          description="Düymələr və kartlar üzərində hover effektlərini aktiv edin."
        />
        <SelectField
          label="Animasiya Sürəti"
          value={localStorefrontConfig.animationSpeed || 'normal'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              animationSpeed: value as 'slow' | 'normal' | 'fast',
            }))
          }
          options={[
            { value: 'slow', label: 'Yavaş (Slow)' },
            { value: 'normal', label: 'Normal' },
            { value: 'fast', label: 'Sürətli (Fast)' },
            { value: 'instant', label: 'Ani (Instant)' },
          ]}
          helperText="Bütün animasiyaların sürəti"
        />
      </div>
    </div>

    {/* Advanced UI Options */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Sparkles className="h-4 w-4 text-emerald-600" /> Advanced UI
      </h3>
      <div className="space-y-4">
        <SwitchToggle
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
        <SwitchToggle
          label="Yuvarlaq Künclər"
          checked={localStorefrontConfig.enableRoundedCorners !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              enableRoundedCorners: v,
            }))
          }
          description="Elementlər üçün yuvarlaq küncləri aktiv edin."
        />
        <SwitchToggle
          label="Gradient Arxa Planlar"
          checked={localStorefrontConfig.enableGradients !== false}
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 8. Storefront Display Settings
// ---------------------------------------------------------
const StorefrontDisplaySettings: SettingTab['component'] = ({
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
        <ShoppingBag className="h-4 w-4 text-emerald-600" /> Məhsul Görünüşü
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Default Görünüş"
          value={localStorefrontConfig.productViewMode || 'grid'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              productViewMode: value,
            }))
          }
          options={[
            { value: 'grid', label: 'Grid (Tor)' },
            { value: 'list', label: 'List (Siyahı)' },
          ]}
          helperText="Məhsul səhifəsində default görünüş"
        />
        <SelectField
          label="Səhifə başına məhsul sayı"
          value={localStorefrontConfig.productsPerPage || '12'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              productsPerPage: value,
            }))
          }
          options={[
            { value: '8', label: '8 məhsul' },
            { value: '12', label: '12 məhsul' },
            { value: '16', label: '16 məhsul' },
            { value: '24', label: '24 məhsul' },
            { value: '36', label: '36 məhsul' },
          ]}
          helperText="Bir səhifədə göstəriləcək məhsul sayı"
        />
        <SelectField
          label="Default Sıralama"
          value={localStorefrontConfig.defaultSort || 'newest'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              defaultSort: value,
            }))
          }
          options={[
            { value: 'newest', label: 'Ən Yenilər' },
            { value: 'price-asc', label: 'Qiymət: Aşağıdan Yuxarı' },
            { value: 'price-desc', label: 'Qiymət: Yuxarıdan Aşağı' },
            { value: 'name-asc', label: 'Ad: A-Z' },
            { value: 'popular', label: 'Populyar' },
          ]}
          helperText="Məhsulların default sıralama qaydası"
        />
        <SelectField
          label="Grid Sütun Sayı"
          value={localStorefrontConfig.gridColumns || '3'}
          onChange={(value) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              gridColumns: value,
            }))
          }
          options={[
            { value: '2', label: '2 sütun' },
            { value: '3', label: '3 sütun (Default)' },
            { value: '4', label: '4 sütun' },
          ]}
          helperText="Grid görünüşündə sütun sayı"
        />
      </div>
    </div>

    {/* Product Card Settings */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Layers className="h-4 w-4 text-emerald-600" /> Məhsul Kartı
      </h3>
      <div className="space-y-4">
        <SwitchToggle
          label="Məhsul təsvirini göstər"
          checked={localStorefrontConfig.showProductDescription !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showProductDescription: v,
            }))
          }
          description="Məhsul kartlarında qısa təsviri göstər."
        />
        <SwitchToggle
          label="Stok miqdarını göstər"
          checked={localStorefrontConfig.showStockQuantity !== false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showStockQuantity: v,
            }))
          }
          description="Məhsul kartlarında qalan stok miqdarını göstər."
        />
        <SwitchToggle
          label="Əlavə olundu bildirişini göstər"
          checked={localStorefrontConfig.showAddToCartNotification !== false}
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 9. SEO & Analytics Settings
// ---------------------------------------------------------
const SEOAnalyticsSettings: SettingTab['component'] = ({
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

    {/* SEO Settings */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Search className="h-4 w-4 text-emerald-600" /> SEO Tənzimləmələri
      </h3>
      <div className="space-y-4">
        <TextAreaField
          label="Meta Description"
          value={localStorefrontConfig.metaDescription || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaDescription: e.target.value,
            }))
          }
          rows={3}
          helperText="Axtarış nəticələrində görünən təsvir (150-160 simvol)"
        />
        <TextAreaField
          label="Meta Keywords"
          value={localStorefrontConfig.metaKeywords?.join(', ') || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              metaKeywords: e.target.value.split(',').map(k => k.trim()),
            }))
          }
          rows={2}
          helperText="Vergüllə ayrılmış açar sözlər"
        />
        <InputField
          label="OG Image URL"
          value={localStorefrontConfig.ogImage || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              ogImage: e.target.value,
            }))
          }
          placeholder="/og-image.jpg"
          icon={ImageIcon}
          helperText="Social media paylaşımı üçün Open Graph şəkli"
        />
      </div>
    </div>

    {/* Analytics */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Monitor className="h-4 w-4 text-emerald-600" /> Analytics & Tracking
      </h3>
      <div className="space-y-4">
        <InputField
          label="Google Analytics ID"
          value={localStorefrontConfig.googleAnalyticsId || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              googleAnalyticsId: e.target.value,
            }))
          }
          placeholder="G-XXXXXXXXXX"
          icon={Monitor}
          helperText="Google Analytics 4 Property ID"
        />
        <InputField
          label="Google Tag Manager ID"
          value={localStorefrontConfig.gtmId || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              gtmId: e.target.value,
            }))
          }
          placeholder="GTM-XXXXXX"
          icon={Tag}
          helperText="Google Tag Manager Container ID"
        />
        <TextAreaField
          label="Custom Analytics Code"
          value={localStorefrontConfig.customAnalyticsCode || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              customAnalyticsCode: e.target.value,
            }))
          }
          rows={4}
          helperText="Əlavə analytics kodları (Facebook Pixel, və s.)"
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 10. Navigation Menu Settings
// ---------------------------------------------------------
const NavigationMenuSettings: SettingTab['component'] = ({
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

    {/* Main Navigation */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Navigation className="h-4 w-4 text-emerald-600" /> Əsas Navigasiya
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
              { label: '', href: '', icon: '' },
            ],
          }))
        }
        renderItem={(item: any, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <InputField
                label="Etiket"
                value={item?.label || ''}
                onChange={(e) => onUpdate({ ...item, label: e.target.value })}
                placeholder="Ana Səhifə"
              />
              <InputField
                label="Link"
                value={item?.href || ''}
                onChange={(e) => onUpdate({ ...item, href: e.target.value })}
                placeholder="/"
                icon={LinkIcon}
              />
              <InputField
                label="Emoji Icon"
                value={item?.icon || ''}
                onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
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
                disabled={index === (localStorefrontConfig.mainNavigation?.length || 0) - 1}
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

    {/* Category Navigation */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Tag className="h-4 w-4 text-emerald-600" /> Kateqoriya Navigasiyası
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
              { label: '', href: '', icon: '' },
            ],
          }))
        }
        renderItem={(item: any, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <InputField
                label="Kateqoriya Adı"
                value={item?.label || ''}
                onChange={(e) => onUpdate({ ...item, label: e.target.value })}
                placeholder="Meyvə və Tərəvəz"
              />
              <InputField
                label="Link"
                value={item?.href || ''}
                onChange={(e) => onUpdate({ ...item, href: e.target.value })}
                placeholder="/category/fruits"
                icon={LinkIcon}
              />
              <InputField
                label="Emoji Icon"
                value={item?.icon || ''}
                onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
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
                disabled={index === (localStorefrontConfig.categoryNavigation?.length || 0) - 1}
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 11. Testimonials & FAQ Settings
// ---------------------------------------------------------
const TestimonialsFAQSettings: SettingTab['component'] = ({
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

    {/* Testimonials */}
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
              { name: '', text: '', rating: 5, role: '' },
            ],
          }))
        }
        renderItem={(testimonial: any, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <InputField
                label="Müştəri Adı"
                value={testimonial?.name || ''}
                onChange={(e) => onUpdate({ ...testimonial, name: e.target.value })}
                placeholder="Əli Vəliyev"
              />
              <InputField
                label="Rol/Vəzifə"
                value={testimonial?.role || ''}
                onChange={(e) => onUpdate({ ...testimonial, role: e.target.value })}
                placeholder="Qaiməkam"
              />
              <TextAreaField
                label="Rəy Mətni"
                value={testimonial?.text || ''}
                onChange={(e) => onUpdate({ ...testimonial, text: e.target.value })}
                rows={2}
                placeholder="Məhsullarınız çox yaxşıdır..."
              />
              <SelectField
                label="Reytinq"
                value={testimonial?.rating?.toString() || '5'}
                onChange={(value) => onUpdate({ ...testimonial, rating: parseInt(value) })}
                options={[
                  { value: '5', label: '⭐⭐⭐⭐⭐ (5)' },
                  { value: '4', label: '⭐⭐⭐⭐ (4)' },
                  { value: '3', label: '⭐⭐⭐ (3)' },
                  { value: '2', label: '⭐⭐ (2)' },
                  { value: '1', label: '⭐ (1)' },
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
                disabled={index === (localStorefrontConfig.testimonials?.length || 0) - 1}
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

    {/* FAQ */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <HelpCircle className="h-4 w-4 text-emerald-600" /> Tez-tez Verilən Suallar (FAQ)
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
              { question: '', answer: '' },
            ],
          }))
        }
        renderItem={(item: any, index, onUpdate, onRemove, onMoveUp, onMoveDown) => (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <InputField
                label="Sual"
                value={item?.question || ''}
                onChange={(e) => onUpdate({ ...item, question: e.target.value })}
                placeholder="Çatdırılma neçə gün çəkir?"
              />
              <TextAreaField
                label="Cavab"
                value={item?.answer || ''}
                onChange={(e) => onUpdate({ ...item, answer: e.target.value })}
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
                disabled={index === (localStorefrontConfig.faq?.length || 0) - 1}
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
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 12. System & Advanced Settings
// ---------------------------------------------------------
const SystemAdvancedSettings: SettingTab['component'] = ({
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

    {/* Maintenance Mode */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <ToggleLeft className="h-4 w-4 text-emerald-600" /> Baxış Rejimi
      </h3>
      <div className="space-y-4">
        <SwitchToggle
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
        <TextAreaField
          label="Baxış Mesajı"
          value={localStorefrontConfig.maintenanceMessage || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              maintenanceMessage: e.target.value,
            }))
          }
          rows={3}
          helperText="Müştərilərə göstəriləcək mesaj"
        />
      </div>
    </div>

    {/* Custom Code */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Code className="h-4 w-4 text-emerald-600" /> Custom Kod
      </h3>
      <div className="space-y-4">
        <TextAreaField
          label="Custom CSS"
          value={localStorefrontConfig.customCss || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              customCss: e.target.value,
            }))
          }
          rows={6}
          helperText="Əlavə CSS kodları (style tag-lər daxil etməyin)"
        />
        <TextAreaField
          label="Custom JavaScript"
          value={localStorefrontConfig.customJs || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              customJs: e.target.value,
            }))
          }
          rows={6}
          helperText="Əlavə JavaScript kodları (script tag-lər daxil etməyin)"
        />
      </div>
    </div>

    {/* Announcement Banner */}
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        <Megaphone className="h-4 w-4 text-emerald-600" /> Elan Banner-i
      </h3>
      <div className="space-y-4">
        <SwitchToggle
          label="Elan Banner-i Göstər"
          checked={localStorefrontConfig.showAnnouncementBanner || false}
          onChange={(v) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              showAnnouncementBanner: v,
            }))
          }
          description="Saytın yuxarı hissəsində elan banner-i göstər."
        />
        <InputField
          label="Elan Mətni"
          value={localStorefrontConfig.announcementText || ''}
          onChange={(e) =>
            setLocalStorefrontConfig((s) => ({
              ...s,
              announcementText: e.target.value,
            }))
          }
          placeholder="🎉 Yeni məhsullarımız gəldi!"
        />
        <ColorPicker
          label="Banner Rəngi"
          value={localStorefrontConfig.announcementColor || '#f59e0b'}
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
        <span>
          Sistem tənzimləmələri dərhal aktiv olunacaq.
        </span>
      </div>
      <Button
        onClick={onSave}
        icon={Save}
        color="emerald"
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? 'Yadda saxlanılır…' : 'Dəyişiklikləri yadda saxla'}
      </Button>
    </motion.div>
  </div>
);

// ---------------------------------------------------------
// 13. Security & Data Settings
// ---------------------------------------------------------
const SecurityDataSettings: SettingTab['component'] = ({
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const handleResetAllData = () => {
    // In real implementation, this would call an API to reset all data
    console.log('Resetting all store data...');
    // Simulate reset
    setTimeout(() => {
      alert('Bütün mağaza datası uğurla sıfırlandı!');
    }, 1000);
  };

  const handleResetPasswords = () => {
    // In real implementation, this would call an API to reset all passwords
    console.log('Resetting all user passwords...');
    setTimeout(() => {
      alert('Bütün istifadəçi şifrələri uğurla sıfırlandı!');
    }, 1000);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    // Simulate export - in real implementation, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Mock data for export
    const mockOrders = [
      { id: 'ORD-001', customer: 'Əli Vəliyev', total: 45.50, status: 'completed', date: '2024-01-15' },
      { id: 'ORD-002', customer: 'Ayşə Məmmədova', total: 32.00, status: 'pending', date: '2024-01-16' },
      { id: 'ORD-003', customer: 'Tofiq Quliyev', total: 78.90, status: 'completed', date: '2024-01-17' },
    ];

    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === 'csv') {
      if (mockOrders.length > 0 && mockOrders[0]) {
        const firstOrder = mockOrders[0] as Record<string, unknown>;
        const headers = Object.keys(firstOrder).join(',');
        const rows = mockOrders.map(order => Object.values(order).join(',')).join('\n');
        content = `${headers}\n${rows}`;
      } else {
        content = '';
      }
      filename = 'orders_export.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(mockOrders, null, 2);
      filename = 'orders_export.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportDialogOpen(false);
  };

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    // Simulate cache refresh - in real implementation, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    alert('Stok cache uğurla yeniləndi!');
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
          Aşağıdakı əməliyyatlar geri qaytarıla bilməz. Yalnız tam əmin olduqda
          istifadə et.
        </p>

        <Button 
          icon={Key} 
          color="red" 
          className="w-full justify-center"
          onClick={() => setPasswordResetDialogOpen(true)}
        >
          Bütün istifadəçi şifrələrini sıfırla
        </Button>
        <Button
          icon={Database}
          color="red"
          className="w-full justify-center"
          onClick={() => setResetDialogOpen(true)}
        >
          Bütün mağaza datasını sıfırla (reset)
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/85 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-blue-700">
          <Download className="h-4 w-4" /> Data İdarəetmə
        </h3>
        <Button
          icon={FileSpreadsheet}
          color="blue"
          className="w-full justify-center"
          onClick={() => setExportDialogOpen(true)}
        >
          CSV/JSON Export (bütün sifarişlər)
        </Button>
        <Button
          icon={RefreshCw}
          color="blue"
          className="w-full justify-center"
          onClick={handleRefreshCache}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Yenilənir...' : 'Stok partiyalarını yenilə (cache refresh)'}
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          icon={Save}
          color="emerald"
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? 'Yadda saxlanılır…' : 'Tənzimləmələri yadda saxla'}
        </Button>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetAllData}
        title="Bütün mağaza datasını sıfırla"
        message="Bu əməliyyat bütün məhsulları, sifarişləri, müştəriləri və digər məlumatları siləcək. Bu əməliyyat geri qaytarıla bilməz. Davam etmək istədiyinizə əminsiniz?"
        confirmText="Bəli, sıfırla"
        cancelText="Ləğv et"
        type="danger"
      />

      <ConfirmDialog
        isOpen={passwordResetDialogOpen}
        onClose={() => setPasswordResetDialogOpen(false)}
        onConfirm={handleResetPasswords}
        title="Bütün istifadəçi şifrələrini sıfırla"
        message="Bu əməliyyat bütün istifadəçi şifrələrini sıfırlayacaq. İstifadəçilər yeni şifrə təyin etməli olacaq. Davam etmək istədiyinizə əminsiniz?"
        confirmText="Bəli, sıfırla"
        cancelText="Ləğv et"
        type="danger"
      />

      {/* Export Format Dialog */}
      {exportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Export Formatı Seçin</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setExportFormat('csv')}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  exportFormat === 'csv'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">CSV Format</div>
                    <div className="text-xs text-slate-500">Excel və Google Sheets üçün uyğun</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  exportFormat === 'json'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-900">JSON Format</div>
                    <div className="text-xs text-slate-500">Developer və API üçün uyğun</div>
                  </div>
                </div>
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setExportDialogOpen(false)} color="ghost">
                Ləğv et
              </Button>
              <Button
                onClick={handleExportData}
                color="emerald"
                disabled={isExporting}
              >
                {isExporting ? 'Export edilir...' : 'Export et'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// MAIN CONFIG (TAB LIST)
// =========================================================

const settingsTabs: SettingTab[] = [
  { id: 'general', label: 'Ümumi', icon: Settings, component: GeneralSettings },
  {
    id: 'store-finance',
    label: 'Mağaza & Maliyyə',
    icon: DollarSign,
    component: StoreFinanceSettings,
  },
  {
    id: 'content-management',
    label: 'Məzmun',
    icon: Layout,
    component: ContentManagementSettings,
  },
  {
    id: 'storefront-display',
    label: 'Storefront',
    icon: Grid,
    component: StorefrontDisplaySettings,
  },
  {
    id: 'navigation-menu',
    label: 'Navigasiya',
    icon: Menu,
    component: NavigationMenuSettings,
  },
  {
    id: 'seo-analytics',
    label: 'SEO & Analytics',
    icon: Globe2,
    component: SEOAnalyticsSettings,
  },
  {
    id: 'testimonials-faq',
    label: 'Rəylər & FAQ',
    icon: MessageSquare,
    component: TestimonialsFAQSettings,
  },
  {
    id: 'premium-ui',
    label: 'Premium UI',
    icon: Sparkles,
    component: PremiumUISettings,
  },
  {
    id: 'system-advanced',
    label: 'Sistem',
    icon: Code,
    component: SystemAdvancedSettings,
  },
  {
    id: 'user-preferences',
    label: 'Admin UI',
    icon: User,
    component: UserPreferences,
  },
  {
    id: 'security-data',
    label: 'Təhlükəsizlik',
    icon: Shield,
    component: SecurityDataSettings,
  },
];

// =========================================================
// MAIN SETTINGS PAGE
// =========================================================

export default function AdminSettingsPage() {
  const {
    storefrontConfig,
    adminUIState,
    updateStorefrontConfig,
    setAdminUIState,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Default dəyərlər – store artıq öz initial dəyərlərini verib,
  // ona görə yalnız undefined olanda fallback veririk.
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
        currency: 'AZN',
        locale: 'az-AZ',
        vatRate: 0.18,
        contactEmail: 'info@organikgedebey.az',
        contactPhone: '',
        shippingFee: 0,
        primaryColor: '#16a34a',
        secondaryColor: '#10b981',
        logoUrl: '/organik_gedebey_logo.jpeg',
        siteTitle: 'Organik Gədəbəy',
        siteDescription: 'Təbii kənd məhsulları',
        fontFamily: 'inter',
        headingFont: 'inter',
        containerWidth: 'default',
        spacingSize: 'medium',
        enablePageTransitions: true,
        enableHoverEffects: true,
        animationSpeed: 'normal',
        enableShadows: true,
        enableRoundedCorners: true,
        enableGradients: true,
        heroTitle: 'Təbii məhsullar bir klik uzağınızda',
        heroSubtitle: '100% organik və təzə',
        heroButtonText: 'Sifariş et',
        heroButtonLink: '/products',
        heroImageUrl: '',
        topBannerText: '🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!',
        topBannerEnabled: true,
        stats: [
          { value: '1000+', label: 'Məhsul', icon: '📦' },
          { value: '5000+', label: 'Müştəri', icon: '👥' },
          { value: '99%', label: 'Məmnuniyyət', icon: '⭐' },
        ],
        footerCopyright: '© 2024 Organik Gədəbəy. Bütün hüquqlar qorunur.',
        footerAboutText: 'Təbiətin əvəzsiz nemətləri bir klik uzağınızda. 100% organik və təzə məhsullar.',
        headerBanners: [
          { text: '🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!', color: 'from-emerald-600 to-teal-600', link: '' },
          { text: '🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10', color: 'from-orange-500 to-red-500', link: '' },
        ],
        headerTopBar: {
          tagline: 'Gədəbəy & Gəncə ailə təsərrüfatları',
          location: 'Özü götürmə & Çatdırılma',
          hours: 'Hər gün 09:00 - 21:00',
        },
        footerQuickLinks: [
          { label: 'Ana Səhifə', href: '/' },
          { label: 'Haqqımızda', href: '/about' },
          { label: 'FAQ', href: '/faq' },
        ],
        trustBadges: [
          { icon: '🌿', title: '100% Organik', description: 'Təbii məhsullar' },
          { icon: '🚚', title: 'Sürətli Çatdırılma', description: '24 saat ərzində' },
          { icon: '💯', title: 'Keyfiyyət Təminatı', description: 'Təzəlik zəmanəti' },
        ],
        socialInstagram: '',
        socialFacebook: '',
        socialWhatsapp: '',
        socialTelegram: '',
        socialYoutube: '',
        socialTwitter: '',
        // Storefront Display
        productViewMode: 'grid',
        productsPerPage: '12',
        defaultSort: 'newest',
        gridColumns: '3',
        showProductDescription: true,
        showStockQuantity: true,
        showAddToCartNotification: true,
        // SEO & Analytics
        metaDescription: 'Təbii kənd məhsulları bir klik uzağınızda. 100% organik və təzə məhsullar.',
        metaKeywords: ['organik', 'təbii', 'kənd məhsulları', 'gedebey', 'gəncə'],
        ogImage: '',
        googleAnalyticsId: '',
        gtmId: '',
        customAnalyticsCode: '',
        // Navigation
        mainNavigation: [
          { label: 'Ana Səhifə', href: '/', icon: '🏠' },
          { label: 'Məhsullar', href: '/products', icon: '🛒' },
          { label: 'Haqqımızda', href: '/about', icon: 'ℹ️' },
          { label: 'Əlaqə', href: '/contact', icon: '📞' },
        ],
        categoryNavigation: [
          { label: 'Meyvə və Tərəvəz', href: '/category/fruits-vegetables', icon: '🍎' },
          { label: 'Süd Məhsulları', href: '/category/dairy', icon: '🥛' },
          { label: 'Bal və Mürəbbə', href: '/category/honey-jam', icon: '🍯' },
        ],
        // Testimonials & FAQ
        testimonials: [
          { name: 'Əli Vəliyev', role: 'Qaiməkam', text: 'Məhsullarınız çox yaxşıdır, həmişə sifariş edirəm.', rating: 5 },
          { name: 'Ayşə Məmmədova', role: 'Ev xanımı', text: 'Təzə və keyfiyyətli məhsullar üçün təşəkkürlər.', rating: 5 },
        ],
        faq: [
          { question: 'Çatdırılma neçə gün çəkir?', answer: 'Çatdırılma adətən 1-3 iş günü çəkir.' },
          { question: 'Məhsullar təzədir?', answer: 'Bəli, bütün məhsullarımız birbaşa kənd təsərrüfatlarından gətirilir.' },
        ],
        // System & Advanced
        maintenanceMode: false,
        maintenanceMessage: 'Sayt texniki baxışdadır. Yaxın zamanda geri qayıdacağıq.',
        customCss: '',
        customJs: '',
        showAnnouncementBanner: false,
        announcementText: '',
        announcementColor: '#f59e0b',
      },
    [storefrontConfig],
  );

  const defaultUIState = useMemo<AdminUIState>(
    () =>
      adminUIState ?? {
        sidebarOpen: true,
        theme: 'light',
        lastVisited: new Date().toISOString(),
      },
    [adminUIState],
  );

  // Local state-lər
  const [localStorefrontConfig, setLocalStorefrontConfig] = useState(
    defaultStorefrontConfig,
  );
  const [localUIState, setLocalUIState] = useState(defaultUIState);

  // Global state dəyişəndə local state-i sync et
  useEffect(() => {
    setLocalStorefrontConfig(defaultStorefrontConfig);
    setLocalUIState(defaultUIState);
    setHasUnsavedChanges(false);
  }, [defaultStorefrontConfig, defaultUIState]);

  // Wrapper-lər – hər dəyişiklikdə hasUnsavedChanges = true
  const updateLocalStorefrontConfig: React.Dispatch<
    React.SetStateAction<
      StorefrontConfig & {
        vatRate?: number;
        contactPhone?: string;
        contactEmail?: string;
        shippingFee?: number;
        locale?: string;
      }
    >
  > = useCallback((value) => {
    setLocalStorefrontConfig((prev) => {
      const next =
        typeof value === 'function'
          ? (value as typeof value)(prev)
          : value;
      setHasUnsavedChanges(true);
      return next;
    });
  }, []);

  const updateLocalUIState: React.Dispatch<
    React.SetStateAction<AdminUIState>
  > = useCallback((value) => {
    setLocalUIState((prev) => {
      const next =
        typeof value === 'function'
          ? (value as typeof value)(prev)
          : value;
      setHasUnsavedChanges(true);
      return next;
    });
  }, []);

  // İstifadəçi pəncərəni bağlayanda xəbərdarlıq
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Save to backend API
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localStorefrontConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save settings (${response.status})`);
      }

      // Update Zustand store after successful API save
      updateStorefrontConfig(localStorefrontConfig);
      setAdminUIState(localUIState);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(`Tənzimləmələr yadda saxlanılmadı: ${error instanceof Error ? error.message : 'Xəta baş verdi'}`);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setHasUnsavedChanges(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [
    localStorefrontConfig,
    localUIState,
    updateStorefrontConfig,
    setAdminUIState,
  ]);

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

      {/* Saving Notification */}
      <AnimatePresence>
        {(isSaving || saveSuccess) && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -15, x: 10 }}
            className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${
              isSaving ? 'bg-blue-500' : 'bg-emerald-600'
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

      {/* Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
        {/* Sidebar Nav */}
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
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
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
                        type: 'spring',
                        stiffness: 320,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Unsaved tiny badge */}
          {hasUnsavedChanges && (
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-[0.75rem] text-amber-800">
              ● Yadda saxlanmamış dəyişikliklər mövcuddur.
            </div>
          )}
        </motion.nav>

        {/* Content Area */}
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
