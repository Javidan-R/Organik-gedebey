// src/components/fresh-today/FreshTodayTypes.ts

import type { Product, Category, ID } from '@/types/products';

// Product tipini re-export edək
export type { Product };

// View modes
export type ViewMode = 'grid' | 'feed';
export type TabMode = 'fresh' | 'upcoming';

// Filter state
export interface FilterState {
  viewMode: ViewMode;
  activeTab: TabMode;
  activeFilter: string;
}

// Story viewer state
export interface StoryViewerState {
  open: boolean;
  startIndex: number;
  current: number;
  progress: number;
  paused: boolean;
}

// Quick view state
export interface QuickViewState {
  open: boolean;
  product: Product | null;
  quantity: number;
}

// Saved items state
export interface SavedState {
  open: boolean;
  savedIds: ID[];
}

// Toast state
export interface ToastState {
  message: string;
  icon?: React.ReactNode;
  visible: boolean;
}

// API response types
export interface FreshProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  categories: Category[];
  meta?: {
    dateThreshold: string;
    daysConsidered: number;
  };
}

export interface UpcomingProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Component props
export interface StoryBubbleProps {
  product: Product | null;
  seen: boolean;
  onClick: () => void;
  index?: number;
}

export interface GridCardProps {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onQuickView: () => void;
  onShare?: () => void;
  index?: number;
}

export interface FeedCardProps {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onShare?: () => void;
  index?: number;
}

export interface UpcomingCardProps {
  product: Product;
  notified: boolean;
  onNotify: () => void;
  index: number;
}

export interface StoryViewerProps {
  products: Product[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

export interface QuickViewSheetProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export interface SavedDrawerProps {
  open: boolean;
  onClose: () => void;
  savedIds: ID[];
  products: Product[];
  onRemove: (id: ID) => void;
}

// Constants
export const STORY_DURATION = 5000;
export const MAX_STORIES = 12;
export const FRESH_DAYS_DEFAULT = 7;