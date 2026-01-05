// src/app/admin/categories/page.tsx
'use client';

import React, {
  useCallback,
  useMemo,
  useState,
  Fragment,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Edit3,
  Archive,
  ArchiveRestore,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BadgeInfo,
} from 'lucide-react';

import {
  useApp,
  useHasHydrated,
  slugifyProductSlug,
  cryptoId,
} from '@/lib/store';
import type { Category, Product, ID } from '@/lib/types';
import { Input } from '@/components/atoms/input';

// =======================================================
// Helper types
// =======================================================

type StatusFilter = 'all' | 'active' | 'archived';
type SortKey =
  | 'created_desc'
  | 'created_asc'
  | 'name_asc'
  | 'name_desc'
  | 'usage_desc'
  | 'usage_asc';

type ConfirmState =
  | null
  | {
      mode: 'archive' | 'unarchive' | 'bulkArchive' | 'bulkUnarchive';
      ids: ID[];
    };

type CategoryDraft = {
  id?: ID;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
  archived: boolean;
  color?: string;
};

// =======================================================
// Small UI primitives
// =======================================================

const AdminPageShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7f2] via-[#f8faf7] to-[#eef3ea]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-8 md:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};

const Pill = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
      active
        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700',
    ].join(' ')}
  >
    {children}
  </button>
);

const OutlineButton = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
      'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700',
      disabled ? 'pointer-events-none opacity-50' : '',
    ].join(' ')}
  >
    {children}
  </button>
);

const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) => (
  <motion.button
    type={type}
    whileTap={!disabled ? { scale: 0.96 } : undefined}
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition',
      'bg-emerald-600 text-white hover:bg-emerald-700',
      disabled ? 'pointer-events-none opacity-50' : '',
    ].join(' ')}
  >
    {children}
  </motion.button>
);

const DangerButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
  >
    {children}
  </motion.button>
);



const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner shadow-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
    {helper && <p className="text-[11px] text-slate-500">{helper}</p>}
  </div>
);

// =======================================================
// Confirm Modal
// =======================================================

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  mode,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  mode: 'danger' | 'default';
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.4)]"
          >
            <div className="flex items-center gap-3">
              {mode === 'danger' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <BadgeInfo className="h-5 w-5" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                İmtina et
              </button>
              {mode === 'danger' ? (
                <DangerButton onClick={onConfirm}>
                  <Archive className="h-4 w-4" />
                  {confirmLabel}
                </DangerButton>
              ) : (
                <PrimaryButton onClick={onConfirm}>
                  <ArchiveRestore className="h-4 w-4" />
                  {confirmLabel}
                </PrimaryButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =======================================================
// Category Drawer (Add / Edit)
// =======================================================

const CategoryDrawer = ({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: Category;
  onClose: () => void;
  onSave: (data: CategoryDraft) => void;
}) => {
  const [slugLocked, setSlugLocked] = useState<boolean>(true);

  const [draft, setDraft] = useState<CategoryDraft>(() => {
    if (mode === 'edit' && initial) {
      return {
        id: initial.id,
        name: initial.name || '',
        slug: initial.slug || '',
        description: initial.description || '',
        featured: !!initial.featured,
        archived: !!initial.archived,
        color: initial.color,
      };
    }

    return {
      name: '',
      slug: '',
      description: '',
      featured: false,
      archived: false,
      color: undefined,
    };
  });

  // reset draft when props change (mode / initial)
  React.useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setDraft({
        id: initial.id,
        name: initial.name || '',
        slug: initial.slug || '',
        description: initial.description || '',
        featured: !!initial.featured,
        archived: !!initial.archived,
        color: initial.color,
      });
      setSlugLocked(true);
    } else if (mode === 'add') {
      setDraft({
        name: '',
        slug: '',
        description: '',
        featured: false,
        archived: false,
        color: undefined,
      });
      setSlugLocked(false);
    }
  }, [open, mode, initial]);

  const handleNameChange = (value: string) => {
    setDraft((prev) => {
      const next: CategoryDraft = { ...prev, name: value };
      if (!slugLocked) {
        next.slug = slugifyProductSlug(value);
      }
      return next;
    });
  };

  const handleSlugChange = (value: string) => {
    setDraft((prev) => ({
      ...prev,
      slug: slugifyProductSlug(value),
    }));
  };

  const canSubmit = draft.name.trim().length > 1 && draft.slug.trim().length > 0;

  const title = mode === 'add' ? 'Yeni kateqoriya əlavə et' : 'Kateqoriyanı redaktə et';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.6)] sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FolderPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {title}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Kateqoriya adı, slug, təsvir və önə çıxma parametrlərini qeyd et.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Input
                label="Kateqoriya adı"
                value={draft.name}
                onChange={handleNameChange}
                required
                placeholder="Məs: Təzə tərəvəzlər"
                helper="Müştərinin görəcəyi ad. SEO üçün də önəmlidir."
              />

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <span>Slug (URL hissəsi)</span>
                  <button
                    type="button"
                    onClick={() => setSlugLocked((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    {slugLocked ? (
                      <>
                        🔒 <span>Slug kilidli</span>
                      </>
                    ) : (
                      <>
                        🔓 <span>Slug avtomatik</span>
                      </>
                    )}
                  </button>
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-inner shadow-slate-100 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                  <span className="text-[11px] text-slate-400">
                    /category/
                  </span>
                  <Input
                    label="Kateqoriya adı"
                    value={draft.slug}
                    onChange={(e) =>
                          slugLocked ? undefined : handleSlugChange((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value)
                        }
                    required
                    placeholder="teze-teravezler"
                    className="h-7 w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"            
                    />
                </div>
                <p className="text-[11px] text-slate-500">
                  URL dostu olmalıdır. Azərbaycan hərfləri avtomatik çevrilir.
                </p>
              </div>

              <TextArea
                label="Qısa təsvir"
                value={draft.description}
                onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
                placeholder="Məs: Gədəbəy və Gəncə təsərrüfatlarından ən təzə tərəvəzlər."
                helper="Bu mətn kateqoriya səhifəsində başlıq altında görünə bilər."
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex flex-col gap-2 text-[11px] text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.featured}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          featured: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    
                    <span className="font-semibold">Mağazada önə çıxart</span>
                  </label>
                  <p>Məs: Ana səhifədə “Populyar bölmələr” siyahısında görünəcək.</p>

                  {mode === 'edit' && (
                    <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={draft.archived}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            archived: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-red-700">
                        Bu kateqoriyanı arxivə sal
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <OutlineButton
                    onClick={() => {
                      setDraft({
                        name: '',
                        slug: '',
                        description: '',
                        featured: false,
                        archived: false,
                      });
                      setSlugLocked(false);
                    }}
                  >
                    <RotateCcwIcon className="h-3 w-3" />
                    <span>Sıfırla</span>
                  </OutlineButton>

                  <PrimaryButton
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => onSave(draft)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {mode === 'add' ? 'Kateqoriya yarat' : 'Dəyişiklikləri saxla'}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// sadə rotate icon (lucide-də RotateCcw var, amma yuxarı OutlineButton içində istifadə üçün)
const RotateCcwIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width={16}
    height={16}
    stroke="currentColor"
    fill="none"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

// =======================================================
// MAIN PAGE
// =======================================================

export default function AdminCategoriesPage() {
  const hydrated = useHasHydrated();

  const categories = useApp((s) => s.categories);
  const products = useApp((s) => s.products);
  const addCategory = useApp((s) => s.addCategory);
  const updateCategory = useApp((s) => s.updateCategory);
  const archiveCategory = useApp((s) => s.archiveCategory);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_desc');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ID[]>([]);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // ===========================
  // Skeleton while hydrating
  // ===========================
  if (!hydrated) {
    return (
      <AdminPageShell>
        <div className="h-7 w-40 animate-pulse rounded-full bg-slate-200/70" />
        <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200/60" />
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200/60" />
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-3xl bg-slate-200/60" />
      </AdminPageShell>
    );
  }

  // ===================================================
  // Derived data
  // ===================================================

  const productUsageMap = useMemo(() => {
    const map = new Map<ID, number>();
    (products || []).forEach((p: Product) => {
      if (!p.categoryId) return;
      if (p.archived) return;
      const current = map.get(p.categoryId) ?? 0;
      map.set(p.categoryId, current + 1);
    });
    return map;
  }, [products]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => !c.archived).length;
  const archivedCategories = totalCategories - activeCategories;

  const filteredCategories = useMemo(() => {
    let list = [...categories];

    if (statusFilter === 'active') {
      list = list.filter((c) => !c.archived);
    } else if (statusFilter === 'archived') {
      list = list.filter((c) => c.archived);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const n = c.name?.toLowerCase() || '';
        const s = c.slug?.toLowerCase() || '';
        const d = c.description?.toLowerCase() || '';
        return n.includes(q) || s.includes(q) || d.includes(q);
      });
    }

    list.sort((a, b) => {
      switch (sortKey) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '', 'az');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '', 'az');
        case 'usage_desc': {
          const ua = productUsageMap.get(a.id) ?? 0;
          const ub = productUsageMap.get(b.id) ?? 0;
          return ub - ua;
        }
        case 'usage_asc': {
          const ua2 = productUsageMap.get(a.id) ?? 0;
          const ub2 = productUsageMap.get(b.id) ?? 0;
          return ua2 - ub2;
        }
        case 'created_asc': {
          const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ca - cb;
        }
        case 'created_desc':
        default: {
          const ca2 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const cb2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return cb2 - ca2;
        }
      }
    });

    return list;
  }, [categories, statusFilter, search, sortKey, productUsageMap]);

  const allSelectedVisible =
    filteredCategories.length > 0 &&
    filteredCategories.every((c) => selectedIds.includes(c.id));
  const someSelectedVisible =
    filteredCategories.some((c) => selectedIds.includes(c.id)) && !allSelectedVisible;

  const selectedCount = selectedIds.length;

  const hasSelection = selectedCount > 0;
  const selectionAllArchived = hasSelection
    ? selectedIds.every(
        (id) => categories.find((c) => c.id === id)?.archived,
      )
    : false;
  const selectionAllActive = hasSelection
    ? selectedIds.every(
        (id) => !categories.find((c) => c.id === id)?.archived,
      )
    : false;

  const handleToggleSelectAllVisible = () => {
    if (allSelectedVisible) {
      const visibleIds = new Set(filteredCategories.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      setSelectedIds((prev) => {
        const set = new Set(prev);
        filteredCategories.forEach((c) => set.add(c.id));
        return Array.from(set);
      });
    }
  };

  const handleToggleRow = (id: ID) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleOpenAdd = () => {
    setEditingCategory(undefined);
    setDrawerMode('add');
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setDrawerMode('edit');
  };

  const handleSaveDraft = (draft: CategoryDraft) => {
    if (drawerMode === 'add') {
      const now = new Date().toISOString();
      const newCat: Category = {
        id: cryptoId(),
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugifyProductSlug(draft.name),
        description: draft.description.trim(),
        featured: draft.featured,
        archived: draft.archived,
        color: draft.color,
        createdAt: now,
      } as Category;

      addCategory(newCat);
    } else if (drawerMode === 'edit' && editingCategory) {
      const updated: Category = {
        ...editingCategory,
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugifyProductSlug(draft.name),
        description: draft.description.trim(),
        featured: draft.featured,
        archived: draft.archived,
        color: draft.color,
      } as Category;
      updateCategory(updated);
    }

    setDrawerMode(null);
    setEditingCategory(undefined);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2200);
  };

  const openArchiveConfirm = useCallback(
    (ids: ID[]) => {
      if (!ids.length) return;
      const allArchived = ids.every(
        (id) => categories.find((c) => c.id === id)?.archived,
      );
      if (allArchived) {
        setConfirmState({
          mode: 'bulkUnarchive',
          ids,
        });
      } else if (
        ids.length === 1 &&
        categories.find((c) => c.id === ids[0])?.archived
      ) {
        setConfirmState({ mode: 'unarchive', ids });
      } else if (ids.length === 1) {
        setConfirmState({ mode: 'archive', ids });
      } else {
        setConfirmState({ mode: 'bulkArchive', ids });
      }
    },
    [categories],
  );

  const handleConfirmAction = () => {
    if (!confirmState) return;
    const { mode, ids } = confirmState;

    if (mode === 'archive' || mode === 'bulkArchive') {
      ids.forEach((id) => {
        archiveCategory(id);
      });
    }

    if (mode === 'unarchive' || mode === 'bulkUnarchive') {
      ids.forEach((id) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return;
        updateCategory({ ...cat, archived: false });
      });
    }

    if (mode === 'bulkArchive' || mode === 'bulkUnarchive') {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    }

    setConfirmState(null);
  };

  // ===================================================
  // Render
  // ===================================================

  return (
    <AdminPageShell>
      {/* Toast for saved changes */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Dəyişikliklər yadda saxlanıldı</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Layers className="h-5 w-5" />
            </span>
            Kateqoriya idarəetməsi
          </h1>
          <p className="text-xs text-slate-600 md:text-sm">
            Kənd məhsullarını düzgün bölmələrə ayır, mağazan nizamlı və alıcı üçün
            rahat görünsün. SEO, filtr və vitrin üçün əsas baza bura ilə qurulur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OutlineButton onClick={() => setAdvancedOpen((s) => !s)}>
            <Filter className="h-4 w-4" />
            <span>Filtrlər & sortlama</span>
            {advancedOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </OutlineButton>
          <PrimaryButton onClick={handleOpenAdd}>
            <FolderPlus className="h-4 w-4" />
            <span>Yeni kateqoriya</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Stats strip */}
      <section className="grid gap-3 rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm md:grid-cols-4">
        <StatCard
          label="Cəmi kateqoriya"
          value={totalCategories}
          helper="Bütün aktiv və arxivdəkilər daxil"
          tone="default"
        />
        <StatCard
          label="Aktiv kateqoriyalar"
          value={activeCategories}
          helper="Mağazada görünən"
          tone="success"
        />
        <StatCard
          label="Arxivdə"
          value={archivedCategories}
          helper="Hazırda gizlədilən"
          tone="muted"
        />
        <StatCard
          label="Seçilən kateqoriya"
          value={selectedCount}
          helper="Bulk əməliyyat üçün"
          tone="accent"
        />
      </section>

      {/* Search + filters */}
      <section className="space-y-3 rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-inner shadow-slate-100 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-50">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kateqoriya adı, slug və ya təsvir üzrə axtar..."
                className="h-7 w-full border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 md:text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              Hamısı
            </Pill>
            <Pill
              active={statusFilter === 'active'}
              onClick={() => setStatusFilter('active')}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Aktiv
            </Pill>
            <Pill
              active={statusFilter === 'archived'}
              onClick={() => setStatusFilter('archived')}
            >
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Arxivdə
            </Pill>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="border-t border-dashed border-slate-200 pt-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold">Sortlama:</span>
                  <Pill
                    active={sortKey === 'created_desc'}
                    onClick={() => setSortKey('created_desc')}
                  >
                    Son əvvəl
                  </Pill>
                  <Pill
                    active={sortKey === 'created_asc'}
                    onClick={() => setSortKey('created_asc')}
                  >
                    Ən köhnə
                  </Pill>
                  <Pill
                    active={sortKey === 'name_asc'}
                    onClick={() => setSortKey('name_asc')}
                  >
                    A-Z
                  </Pill>
                  <Pill
                    active={sortKey === 'name_desc'}
                    onClick={() => setSortKey('name_desc')}
                  >
                    Z-A
                  </Pill>
                  <Pill
                    active={sortKey === 'usage_desc'}
                    onClick={() => setSortKey('usage_desc')}
                  >
                    Ən çox istifadə
                  </Pill>
                  <Pill
                    active={sortKey === 'usage_asc'}
                    onClick={() => setSortKey('usage_asc')}
                  >
                    Ən az istifadə
                  </Pill>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setSortKey('created_desc');
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  Parametrləri sıfırla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Bulk actions strip */}
      <AnimatePresence initial={false}>
        {hasSelection && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <p>
                <span className="font-semibold">{selectedCount}</span>{' '}
                kateqoriya seçilib. Bulk əməliyyat yalnız bu kateqoriyalara
                tətbiq olunacaq.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OutlineButton
                onClick={() => openArchiveConfirm(selectedIds)}
              >
                {selectionAllArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    <span>Seçilənləri aktivləşdir</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    <span>Seçilənləri arxivə sal</span>
                  </>
                )}
              </OutlineButton>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] font-semibold text-amber-900 underline underline-offset-2"
              >
                Seçimi təmizlə
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Category table */}
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-sm md:p-4">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-600">
            <span className="text-3xl">🌱</span>
            <p className="font-semibold">
              Şərtlərə uyğun kateqoriya tapılmadı.
            </p>
            <p className="text-xs text-slate-500">
              Yeni kateqoriya əlavə edərək mağazanı daha da nizamlı edə
              bilərsən.
            </p>
            <PrimaryButton onClick={handleOpenAdd}>
              <FolderPlus className="h-4 w-4" />
              Yeni kateqoriya yarat
            </PrimaryButton>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="hidden bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[auto,2fr,2fr,1fr,auto] md:gap-3 md:px-4 md:py-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelectedVisible}
                  ref={(el) => {
                    if (!el) return;
                    el.indeterminate = someSelectedVisible;
                  }}
                  onChange={handleToggleSelectAllVisible}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Kateqoriya</span>
              </div>
              <div>Slug & təsvir</div>
              <div>İstifadə sayı</div>
              <div>Status</div>
              <div className="text-right">Əməliyyatlar</div>
            </div>

            <AnimatePresence initial={false}>
              {filteredCategories.map((cat) => {
                const usage = productUsageMap.get(cat.id) ?? 0;
                const isSelected = selectedIds.includes(cat.id);
                const isNew =
                  cat.createdAt &&
                  Date.now() - new Date(cat.createdAt).getTime() <
                    7 * 24 * 60 * 60 * 1000;

                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className={[
                      'border-t border-slate-100 bg-white text-sm text-slate-800',
                      isSelected ? 'bg-emerald-50/40' : '',
                    ].join(' ')}
                  >
                    {/* Desktop row */}
                    <div className="hidden items-center gap-3 px-4 py-3 md:grid md:grid-cols-[auto,2fr,2fr,1fr,auto]">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(cat.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {cat.name || 'Adsız kateqoriya'}
                            </span>
                            {cat.featured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <Star className="h-3 w-3 fill-emerald-400" />
                                Önlük
                              </span>
                            )}
                            {isNew && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                Yeni
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="line-clamp-1 text-[11px] text-slate-500">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col text-[11px] text-slate-600">
                        <span className="font-mono text-[11px] text-slate-500">
                          /category/{cat.slug || 'slug-yoxdur'}
                        </span>
                        {cat.color && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px]">
                            <span
                              className="h-3 w-3 rounded-full border border-slate-200"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.color}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600">
                        {usage === 0 ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Hələ məhsul bağlanmayıb
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {usage} məhsul
                          </span>
                        )}
                      </div>

                      <div className="text-[11px]">
                        {cat.archived ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Arxivdə
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Aktiv
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 text-[11px]">
                        <OutlineButton onClick={() => handleOpenEdit(cat)}>
                          <Edit3 className="h-4 w-4" />
                          Redaktə
                        </OutlineButton>
                        <OutlineButton onClick={() => openArchiveConfirm([cat.id])}>
                          {cat.archived ? (
                            <>
                              <ArchiveRestore className="h-4 w-4" />
                              Aktiv et
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4" />
                              Arxivə
                            </>
                          )}
                        </OutlineButton>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="flex flex-col gap-2 px-3 py-2 md:hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(cat.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-sm font-semibold text-slate-900">
                                {cat.name || 'Adsız kateqoriya'}
                              </span>
                              {cat.featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  <Star className="h-3 w-3 fill-emerald-400" />
                                  Önlük
                                </span>
                              )}
                              {isNew && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                  Yeni
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                                {cat.description}
                              </p>
                            )}
                            <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                              /category/{cat.slug || 'slug-yoxdur'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-[10px]">
                          <span
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                              usage === 0
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-50 text-emerald-700',
                            ].join(' ')}
                          >
                            {usage === 0 ? 'Məhsul yoxdur' : `${usage} məhsul`}
                          </span>
                          <span
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                              cat.archived
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-50 text-emerald-700',
                            ].join(' ')}
                          >
                            {cat.archived ? 'Arxivdə' : 'Aktiv'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Redaktə
                        </button>
                        <button
                          type="button"
                          onClick={() => openArchiveConfirm([cat.id])}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          {cat.archived ? (
                            <>
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              Aktiv
                            </>
                          ) : (
                            <>
                              <Archive className="h-3.5 w-3.5" />
                              Arxiv
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Drawer */}
      <CategoryDrawer
        open={drawerMode !== null}
        mode={drawerMode === 'edit' ? 'edit' : 'add'}
        initial={editingCategory}
        onClose={() => {
          setDrawerMode(null);
          setEditingCategory(undefined);
        }}
        onSave={handleSaveDraft}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        mode={
          confirmState?.mode === 'archive' ||
          confirmState?.mode === 'bulkArchive'
            ? 'danger'
            : 'default'
        }
        title={
          confirmState?.mode === 'archive'
            ? 'Kateqoriyanı arxivə salmaq istəyirsən?'
            : confirmState?.mode === 'bulkArchive'
            ? 'Seçilən kateqoriyalar arxivə göndərilsin?'
            : confirmState?.mode === 'unarchive'
            ? 'Kateqoriyanı yenidən aktivləşdir?'
            : confirmState?.mode === 'bulkUnarchive'
            ? 'Seçilən kateqoriyalar aktivləşdirilsin?'
            : ''
        }
        description={
          confirmState?.mode === 'archive'
            ? 'Bu kateqoriya mağazada gizlədiləcək, lakin bağlı məhsullar silinməyəcək.'
            : confirmState?.mode === 'bulkArchive'
            ? 'Bütün seçilmiş kateqoriyalar mağazada gizlədiləcək. Məhsulların kateqoriya bağlantısı dəyişməyəcək.'
            : confirmState?.mode === 'unarchive'
            ? 'Bu kateqoriya yenidən aktiv kateqoriyalar siyahısında görünəcək.'
            : confirmState?.mode === 'bulkUnarchive'
            ? 'Seçilən bütün kateqoriyalar yenidən aktiv ediləcək və vitrində görünə biləcək.'
            : ''
        }
        confirmLabel={
          confirmState?.mode === 'archive'
            ? 'Arxivə göndər'
            : confirmState?.mode === 'bulkArchive'
            ? 'Hamısını arxivə göndər'
            : confirmState?.mode === 'unarchive'
            ? 'Aktiv et'
            : confirmState?.mode === 'bulkUnarchive'
            ? 'Hamısını aktiv et'
            : ''
        }
      />
    </AdminPageShell>
  );
}

// =======================================================
// Stat card
// =======================================================

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: 'default' | 'success' | 'muted' | 'accent';
}) {
  let ringClass = 'ring-slate-100';
  let iconBg = 'bg-slate-100';
  let iconColor = 'text-slate-700';

  if (tone === 'success') {
    ringClass = 'ring-emerald-100';
    iconBg = 'bg-emerald-50';
    iconColor = 'text-emerald-700';
  } else if (tone === 'accent') {
    ringClass = 'ring-amber-100';
    iconBg = 'bg-amber-50';
    iconColor = 'text-amber-700';
  } else if (tone === 'muted') {
    ringClass = 'ring-slate-100';
    iconBg = 'bg-slate-100';
    iconColor = 'text-slate-600';
  }

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2.5 shadow-xs ring-1',
        ringClass,
      ].join(' ')}
    >
      <div
        className={[
          'flex h-8 w-8 items-center justify-center rounded-2xl text-sm',
          iconBg,
          iconColor,
        ].join(' ')}
      >
        <Layers className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-slate-500">
          {label}
        </span>
        <span className="text-lg font-bold text-slate-900">
          {value}
        </span>
        <span className="text-[11px] text-slate-500">{helper}</span>
      </div>
    </div>
  );
}
