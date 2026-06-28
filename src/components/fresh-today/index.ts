// src/components/fresh-today/index.ts

// Komponentlər
export { default as StoryBubble } from './StoryBubble';
export { default as GridCard } from './GridCard';
export { default as FeedCard } from './FeedCard';
export { default as UpcomingCard } from './UpcomingCard';
export { default as StoryViewer } from './StoryViewer';
export { default as QuickViewSheet } from './QuickViewSheet';
export { default as SavedDrawer } from './SavedDrawer';
export { default as Toast } from './Toast';

// Hooks
export {
  useFreshProducts,
  useUpcomingProducts,
  useLocalStorage,
  useToast,
  useFilteredProducts,
  useStoryViewer
} from './hooks';

// Types
export type {
  ViewMode,
  TabMode,
  FilterState,
  StoryViewerState,
  QuickViewState,
  SavedState,
  ToastState,
  FreshProductsResponse,
  UpcomingProductsResponse,
  StoryBubbleProps,
  GridCardProps,
  FeedCardProps,
  UpcomingCardProps,
  StoryViewerProps,
  QuickViewSheetProps,
  SavedDrawerProps,
  Product
} from './FreshTodayTypes';

// Constants
export { STORY_DURATION, MAX_STORIES, FRESH_DAYS_DEFAULT } from './FreshTodayTypes';

// Utils
export {
  safeGetImageUrl,
  getProductBasePrice,
  calculateDiscount,
  getProductStock,
  isLowStock,
  isOutOfStock,
  isHotProduct,
  formatProductPrice,
  formatOriginalPrice,
  getProductOrigin,
  isNewArrival,
  isUpcoming,
  generateShareText,
  generateWhatsAppMessage,
  validateProduct,
  sortByFreshness,
  filterFreshProducts,
  filterUpcomingProducts
} from './utils/productHelpers';