// src/components/admin/CategoryTree.tsx
// Tam, qısaldılmamış, production-ready, react-hot-toast, classNames ilə

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Star,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  GripVertical,
} from 'lucide-react';
import Image from 'next/image';
import { classNames } from '@/lib/utils/classnames';
import { getCategoryImageUrl, getCategoryImageAlt } from '@/lib/category-helpers';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms/button';
import type { Category, CategoryTree } from '@/types/category';

// ─── Props ──────────────────────────────────────────────────────────────────────

interface CategoryTreeProps {
  categories: CategoryTree[];
  onEdit: (cat: Category) => void;
  onArchive: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onReorder: (items: { id: string; displayOrder: number; parentId: string | null }[]) => Promise<void>;
  isLoading?: boolean;
}

// ─── Tree Item Component ──────────────────────────────────────────────────────

interface TreeItemProps {
  category: CategoryTree;
  depth: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (cat: Category) => void;
  onArchive: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  isDragOverlay?: boolean;
}

function TreeItem({
  category,
  depth,
  isExpanded,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  isDragOverlay = false,
}: TreeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 20 + 8}px`,
  };

  const hasChildren = category.children && category.children.length > 0;
  const imageUrl = getCategoryImageUrl(category);
  const imageAlt = getCategoryImageAlt(category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(
        'group flex items-center gap-2 py-2 px-2 rounded-xl hover:bg-slate-50 transition-colors',
        isDragging && 'opacity-50',
        isDragOverlay && 'bg-white shadow-lg ring-1 ring-emerald-200 opacity-100',
        category.archived && 'opacity-60'
      )}
      {...attributes}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 cursor-grab p-1 rounded hover:bg-slate-200 transition touch-none"
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Expand/collapse */}
      {hasChildren ? (
        <button
          onClick={() => onToggle(category.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-slate-200 transition"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>
      ) : (
        <div className="w-6 flex-shrink-0" />
      )}

      {/* Icon/Image */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
        {category.imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={32}
            height={32}
            className="object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Folder className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={classNames(
              'text-sm font-medium truncate',
              category.archived && 'text-slate-400'
            )}
          >
            {category.name}
          </span>
          {category.isFeatured && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
          {category.archived && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">
              Arxivdə
            </span>
          )}
          {!category.isActive && !category.archived && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex-shrink-0">
              Deaktiv
            </span>
          )}
        </div>
        {category.description && (
          <p className="text-xs text-slate-400 truncate">{category.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onEdit(category)}
          className="p-1.5"
          title="Redaktə et"
        >
          <Edit className="w-4 h-4 text-slate-500" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onArchive(category)}
          className="p-1.5"
          title={category.archived ? 'Aktivləşdir' : 'Arxivlə'}
        >
          {category.archived ? (
            <ArchiveRestore className="w-4 h-4 text-slate-500" />
          ) : (
            <Archive className="w-4 h-4 text-slate-500" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onDelete(category)}
          className="p-1.5 hover:bg-red-100"
          title="Sil"
        >
          <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CategoryTree({
  categories,
  onEdit,
  onArchive,
  onDelete,
  onReorder,
  isLoading = false,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<CategoryTree[]>(categories);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // ─── DnD Sensors ──────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ─── Tree Flattening ──────────────────────────────────────────────────────

  const flattenTree = useCallback(
    (tree: CategoryTree[], parentId: string | null = null, depth: number = 0): any[] => {
      let flat: any[] = [];
      tree.forEach((node, index) => {
        flat.push({
          ...node,
          parentId,
          depth,
          displayOrder: index,
        });
        if (expandedIds.has(node.id) && node.children && node.children.length > 0) {
          flat = flat.concat(flattenTree(node.children, node.id, depth + 1));
        }
      });
      return flat;
    },
    [expandedIds]
  );

  const flatItems = flattenTree(items);

  // ─── Sync with props ─────────────────────────────────────────────────────

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (active.id === over.id) return;

    setIsReordering(true);
    try {
      const activeIndex = flatItems.findIndex((item) => item.id === active.id);
      const overIndex = flatItems.findIndex((item) => item.id === over.id);

      if (activeIndex === -1 || overIndex === -1) return;

      const reorderedFlat = arrayMove(flatItems, activeIndex, overIndex);

      // Rebuild tree from flat list
      const buildTreeFromFlat = (flat: any[]): CategoryTree[] => {
        const map = new Map<string, any>();
        const roots: CategoryTree[] = [];

        flat.forEach((item) => {
          map.set(item.id, { ...item, children: [] });
        });

        flat.forEach((item) => {
          const node = map.get(item.id);
          if (item.parentId && map.has(item.parentId)) {
            const parent = map.get(item.parentId);
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        });

        return roots;
      };

      const newTree = buildTreeFromFlat(reorderedFlat);
      setItems(newTree);

      const reorderData = reorderedFlat.map((item, index) => ({
        id: item.id,
        displayOrder: index,
        parentId: item.parentId || null,
      }));

      await onReorder(reorderData);
      toast.success('Sıralama yeniləndi', {
        icon: '✅',
        duration: 3000,
        position: 'top-center',
      });
    } catch (error) {
      toast.error('Sıralama yenilənərkən xəta', {
        icon: '❌',
        duration: 4000,
        position: 'top-center',
      });
      setItems(categories);
    } finally {
      setIsReordering(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Kateqoriyalar yüklənir...</span>
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Folder className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-medium">Heç bir kateqoriya yoxdur</p>
        <p className="text-sm text-slate-400 mt-1">Yeni kateqoriya yaratmaq üçün "Yeni kateqoriya" düyməsini istifadə edin.</p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={flatItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5 bg-white rounded-xl border border-slate-200 p-2">
          {flatItems.map((item) => (
            <TreeItem
              key={item.id}
              category={item}
              depth={item.depth || 0}
              isExpanded={expandedIds.has(item.id)}
              onToggle={handleToggle}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <TreeItem
            category={flatItems.find((item) => item.id === activeId) as CategoryTree}
            depth={0}
            isExpanded={false}
            onToggle={() => {}}
            onEdit={() => {}}
            onArchive={() => {}}
            onDelete={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}