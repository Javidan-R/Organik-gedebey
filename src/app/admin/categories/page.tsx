// src/app/admin/categories/page.tsx
// React Query cache hooks + react-hot-toast + classNames + atoms
// Bütün fetch çağırışlarına `credentials: 'include'` əlavə edildi
// Production-ready, tam, qısaldılmamış versiya

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon,
  Folder,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Grid3X3,
  ListTree,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  getCategoryImageUrl,
  getCategoryImageAlt,
} from '@/lib/category-helpers';
import { useCategories, useCategoryTree, useInvalidateCategories } from '@/lib/cache/category-cache';
import { CategoryFormModal } from '@/components/admin/categories/CategoryFormModal';
import { ConfirmDialog } from '@/components/admin/categories/ConfirmDialog';
import { CategoryTree } from '@/components/admin/categories/CategoryTree';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { classNames } from '@/lib/utils/classnames';
import type { Category, CategoryTree as CategoryTreeType, CategoryFilters } from '@/types/category';

// ─── Sub-komponentlər ──────────────────────────────────────────────────────────

/** Status göstəricisi */
const StatusPill = ({ active, archived }: { active: boolean; archived: boolean }) => {
  if (archived) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Archive className="w-3 h-3" />
        Arxivdə
      </span>
    );
  }
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Aktiv
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <EyeOff className="w-3 h-3" />
      Deaktiv
    </span>
  );
};

/** Önə çıxan nişanı */
const FeaturedBadge = ({ featured }: { featured: boolean }) => {
  if (!featured) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      Önə çıxan
    </span>
  );
};

/** Kateqoriya kartı komponenti */
function CategoryCard({
  category,
  onEdit,
  onArchive,
  onDelete,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
  onArchive: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getCategoryImageUrl(category);
  const imageAlt = getCategoryImageAlt(category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={classNames(
        'group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden',
        category.archived ? 'border-slate-200 opacity-70' : 'border-slate-200'
      )}
    >
      <div className="aspect-video relative bg-slate-100 overflow-hidden">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {category.isFeatured && (
          <div className="absolute top-2 left-2">
            <FeaturedBadge featured={true} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-emerald-600 shadow-md transition"
            title="Redaktə et"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onArchive(category)}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-amber-600 shadow-md transition"
            title={category.archived ? 'Aktivləşdir' : 'Arxivlə'}
          >
            {category.archived ? (
              <ArchiveRestore className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-red-600 shadow-md transition"
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
              {category.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              /{category.slug}
            </p>
          </div>
          <StatusPill active={!!category.isActive} archived={!!category.archived} />
        </div>

        {category.description && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
            {category.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {category._count?.products || 0} məhsul
          </span>
          {category.children && category.children.length > 0 && (
            <span className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              {category.children.length} alt
            </span>
          )}
          {category.color && (
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full border border-slate-200"
                style={{ backgroundColor: category.color }}
              />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Əsas Səhifə ──────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CategoryFilters>({
    isActive: undefined,
    isFeatured: undefined,
    archived: false,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    mode: 'danger' | 'default';
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── React Query Hooks ──────────────────────────────────────────────────────
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useCategories({
    isActive: filters.isActive,
    archived: filters.archived,
  });

  const {
    data: treeData = [],
    isLoading: isTreeLoading,
    refetch: refetchTree,
  } = useCategoryTree({
    includeArchived: filters.archived === true,
  });

  const invalidateCache = useInvalidateCategories();

  // ─── Filtrlənmiş kateqoriyalar (search) ──────────────────────────────────
  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const term = search.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
    );
  }, [categories, search]);

  // ─── CRUD Handlerlər ──────────────────────────────────────────────────────

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      const url = modalMode === 'create'
        ? '/api/admin/categories'
        : `/api/admin/categories/${selectedCategory?.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Xəta baş verdi');
      }

      toast.success(modalMode === 'create' ? 'Kateqoriya yaradıldı' : 'Kateqoriya yeniləndi', {
        icon: '✅',
        duration: 3000,
        position: 'top-right',
      });
      setIsModalOpen(false);
      invalidateCache();
      await refetch();
      if (viewMode === 'tree') await refetchTree();
    } catch (error: any) {
      toast.error(error.message || 'Xəta baş verdi', {
        icon: '❌',
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleArchive = (category: Category) => {
    setConfirmDialog({
      open: true,
      title: category.archived ? 'Kateqoriyanı aktivləşdir?' : 'Kateqoriyanı arxivə göndər?',
      description: category.archived
        ? 'Bu kateqoriya yenidən mağazada görünəcək.'
        : 'Kateqoriya mağazada gizlədiləcək, lakin məhsullar silinməyəcək.',
      mode: category.archived ? 'default' : 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/categories/${category.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ archived: !category.archived, isActive: category.archived }),
          });
          if (!res.ok) throw new Error('Xəta baş verdi');
          toast.success(category.archived ? 'Kateqoriya aktivləşdirildi' : 'Kateqoriya arxivləndi', {
            icon: '📦',
            duration: 3000,
            position: 'top-right',
          });
          invalidateCache();
          await refetch();
          if (viewMode === 'tree') await refetchTree();
        } catch (error) {
          toast.error('Əməliyyat uğursuz oldu', {
            icon: '❌',
            duration: 4000,
            position: 'top-right',
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDelete = (category: Category) => {
    setConfirmDialog({
      open: true,
      title: 'Kateqoriyanı tam sil?',
      description: `"${category.name}" kateqoriyası və bütün bağlı məlumatlar silinəcək. Bu əməliyyat geri qaytarıla bilməz.`,
      mode: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/categories/${category.id}?permanent=true`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const error = await res.json();
            if (error.hasChildren) {
              toast.error('Bu kateqoriyanın alt kateqoriyaları var. Əvvəlcə onları silin.', {
                icon: '⚠️',
                duration: 5000,
                position: 'top-right',
              });
              setConfirmDialog(null);
              return;
            }
            throw new Error(error.error || 'Xəta baş verdi');
          }
          toast.success('Kateqoriya silindi', {
            icon: '🗑️',
            duration: 3000,
            position: 'top-right',
          });
          invalidateCache();
          await refetch();
          if (viewMode === 'tree') await refetchTree();
        } catch (error: any) {
          toast.error(error.message || 'Silinmə uğursuz oldu', {
            icon: '❌',
            duration: 4000,
            position: 'top-right',
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleReorder = useCallback(async (items: { id: string; displayOrder: number; parentId: string | null }[]) => {
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Reorder failed');
      toast.success('Sıralama yeniləndi', {
        icon: '🔄',
        duration: 2000,
        position: 'top-right',
      });
      invalidateCache();
      await refetchTree();
    } catch (error) {
      toast.error('Sıralama yenilənərkən xəta', {
        icon: '❌',
        duration: 4000,
        position: 'top-right',
      });
      await refetchTree();
    }
  }, [refetchTree, invalidateCache]);

  const handleBatchAction = useCallback(async (action: 'archive' | 'unarchive' | 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;

    const actionLabels = {
      archive: 'arxivə göndər',
      unarchive: 'aktivləşdir',
      activate: 'aktiv et',
      deactivate: 'deaktiv et',
      delete: 'sil',
    };

    setConfirmDialog({
      open: true,
      title: `Seçilmiş kateqoriyaları ${actionLabels[action]}?`,
      description: `${selectedIds.length} kateqoriya üzərində bu əməliyyat icra olunacaq.`,
      mode: action === 'delete' || action === 'archive' ? 'danger' : 'default',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/categories/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ids: selectedIds, action }),
          });
          if (!res.ok) {
            const err = await res.json();
            if (err.hasChildren) {
              toast.error('Bəzi kateqoriyaların alt kateqoriyaları var. Əvvəlcə onları silin.', {
                icon: '⚠️',
                duration: 5000,
                position: 'top-right',
              });
              setConfirmDialog(null);
              return;
            }
            throw new Error(err.error || 'Xəta');
          }
          toast.success(`${selectedIds.length} kateqoriya üzərində əməliyyat tamamlandı`, {
            icon: '✅',
            duration: 3000,
            position: 'top-right',
          });
          setSelectedIds([]);
          invalidateCache();
          await refetch();
          if (viewMode === 'tree') await refetchTree();
        } catch (error: any) {
          toast.error(error.message || 'Batch əməliyyatı uğursuz oldu', {
            icon: '❌',
            duration: 4000,
            position: 'top-right',
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [selectedIds, refetch, refetchTree, invalidateCache, viewMode]);

  const toggleSelectCategory = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setFilters({ isActive: undefined, isFeatured: undefined, archived: false });
    setSelectedIds([]);
  }, []);

  const activeFilterCount = useMemo(() => [
    filters.isActive !== undefined,
    filters.isFeatured !== undefined,
    filters.archived === true,
    search !== '',
  ].filter(Boolean).length, [filters, search]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Layers className="w-8 h-8 text-emerald-600" />
              Kateqoriyalar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Mağaza kateqoriyalarını idarə edin, məhsulları qruplaşdırın
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={classNames(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'grid'
                    ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                )}
                aria-label="Grid görünüşü"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={classNames(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'tree'
                    ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                )}
                aria-label="Ağac görünüşü"
              >
                <ListTree className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-5 h-5" />}
              onClick={handleCreate}
              className="shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35"
            >
              Yeni kateqoriya
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Kateqoriya axtar..."
                value={search}
                onChange={(val) => setSearch(val)}
                className="pl-9"
                containerClassName="flex-1"
              />
            </div>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<Filter className="w-4 h-4" />}
              rightIcon={
                <ChevronDown className={classNames('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
              }
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtrlər
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                invalidateCache();
                refetch();
                if (viewMode === 'tree') refetchTree();
              }}
            >
              Yenilə
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-slate-100 mt-3 flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.isActive === true}
                      onChange={() => setFilters(f => ({ ...f, isActive: f.isActive === true ? undefined : true }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Aktiv
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.isActive === false}
                      onChange={() => setFilters(f => ({ ...f, isActive: f.isActive === false ? undefined : false }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Deaktiv
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured === true}
                      onChange={() => setFilters(f => ({ ...f, isFeatured: f.isFeatured === true ? undefined : true }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Önə çıxan
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.archived === true}
                      onChange={() => setFilters(f => ({ ...f, archived: f.archived === true ? undefined : true }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Arxivdə
                  </label>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setFilters({ isActive: undefined, isFeatured: undefined, archived: false })}
                  >
                    Sıfırla
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Batch Toolbar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center gap-3 bg-amber-50 rounded-xl border border-amber-200 p-3 mb-4"
            >
              <span className="text-sm font-medium text-amber-800">
                {selectedIds.length} kateqoriya seçilib
              </span>
              <div className="flex flex-wrap gap-2">
                {(['archive', 'unarchive', 'activate', 'deactivate', 'delete'] as const).map((action) => (
                  <Button
                    key={action}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBatchAction(action)}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    {action === 'archive' ? 'Arxivlə' :
                     action === 'unarchive' ? 'Aktivləşdir' :
                     action === 'activate' ? 'Aktiv et' :
                     action === 'deactivate' ? 'Deaktiv et' : 'Sil'}
                  </Button>
                ))}
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="text-amber-600 ml-auto"
              >
                Ləğv et
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {viewMode === 'grid' ? (
          <>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-slate-500 mt-4">Yüklənir...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-slate-600">Xəta baş verdi</p>
                <Button variant="primary" onClick={() => refetch()}>
                  Yenidən cəhd et
                </Button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700">Kateqoriya yoxdur</h3>
                <p className="text-slate-500">İlk kateqoriyanı yaratmaq üçün "Yeni kateqoriya" düyməsini istifadə edin.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={filteredCategories.every(c => selectedIds.includes(c.id))}
                    onChange={() => {
                      const allIds = filteredCategories.map(c => c.id);
                      const allSelected = allIds.every(id => selectedIds.includes(id));
                      if (allSelected) {
                        setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
                      } else {
                        setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-500">Hamısını seç</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className={classNames(
                        'relative',
                        selectedIds.includes(category.id) && 'ring-2 ring-emerald-400 ring-offset-2 rounded-2xl'
                      )}
                    >
                      <div className="absolute top-3 left-3 z-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(category.id)}
                          onChange={() => toggleSelectCategory(category.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <CategoryCard
                        category={category}
                        onEdit={handleEdit}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <CategoryTree
              categories={treeData}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onReorder={handleReorder}
              isLoading={isTreeLoading}
            />
          </div>
        )}

        {/* Modals */}
        <CategoryFormModal
          open={isModalOpen}
          mode={modalMode}
          initialData={selectedCategory}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />

        {confirmDialog && (
          <ConfirmDialog
            open={confirmDialog.open}
            title={confirmDialog.title}
            description={confirmDialog.description}
            mode={confirmDialog.mode}
            onClose={() => setConfirmDialog(null)}
            onConfirm={confirmDialog.onConfirm}
          />
        )}
      </div>
    </div>
  );
}