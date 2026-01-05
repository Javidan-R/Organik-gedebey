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
    };
    setLocalStorefrontConfig: React.Dispatch<
      React.SetStateAction<
        StorefrontConfig & {
          vatRate?: number;
          contactPhone?: string;
          contactEmail?: string;
          shippingFee?: number;
          locale?: string;
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
// 4. Security & Data Settings
// ---------------------------------------------------------
const SecurityDataSettings: SettingTab['component'] = ({
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => (
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

      <Button icon={Key} color="red" className="w-full justify-center">
        Bütün istifadəçi şifrələrini sıfırla
      </Button>
      <Button
        icon={Database}
        color="red"
        className="w-full justify-center"
        onClick={() =>
          alert('Bütün data silinəcək – real mühitdə təsdiq dialoqu əlavə et!')
        }
      >
        Bütün mağaza datasını sıfırla (reset)
      </Button>
    </div>

    <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/85 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-blue-700">
        <Download className="h-4 w-4" /> Data İdarəetmə
      </h3>
      <Button
        icon={Download}
        color="blue"
        className="w-full justify-center"
        onClick={() =>
          alert('Burada CSV/JSON export servisinə API çağırışı gedəcək.')
        }
      >
        CSV/JSON Export (bütün sifarişlər)
      </Button>
      <Button
        icon={RefreshCw}
        color="blue"
        className="w-full justify-center"
        onClick={() =>
          alert('Stok cache yenilənməsi üçün backend endpoint çağırmaq olar.')
        }
      >
        Stok partiyalarını yenilə (cache refresh)
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
  </div>
);

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

    // Zustand store-a yaz
    updateStorefrontConfig(localStorefrontConfig);
    setAdminUIState(localUIState);

    await new Promise((resolve) => setTimeout(resolve, 800));

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
