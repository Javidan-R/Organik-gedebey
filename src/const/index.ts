import { LiveActivity, NotificationItem, WeatherData } from "@/types/home"

export const DAYS_7_IN_MS = 7 * 24 * 60 * 60 * 1000
export const DEFAULT_CURRENCY = 'AZN'
export const RECENT_PRODUCTS_STORAGE_KEY = 'og-recent-products'
export const WISHLIST_STORAGE_KEY = 'og-wishlist'
export const USER_POINTS_KEY = 'og-user-points'
export const COMPARE_STORAGE_KEY = 'og-compare'
export const MAX_DISPLAYED_ITEMS = 8
export const MAX_POPULAR_ITEMS = 12
export const MAX_BADGES = 3
export const MINIMUM_REVIEWS_FOR_MUST_TRY = 3
export const MOBILE_BREAKPOINT = 768
export const MAX_COMPARE_ITEMS = 3

export const PRODUCT_SCORING_WEIGHTS = {
  DISCOUNT: 0.5,
  RATING: 4,
  ORGANIC: 8,
  MUST_TRY: 12,
  NEW_PRODUCT: 3,
  VIEW_COUNT: 2,
  WISHLIST_COUNT: 3,
} as const

export const GEDEBEY_REGION_VARIANTS = ['gədəbəy', 'gedebey'] as  const
export const BREAKFAST_TAGS = ['səhər yeməyi', 'breakfast', 'çay süfrəsi'] as  const

export const LIVE_ACTIVITIES: LiveActivity[] = [
  { id: '1', type: 'purchase', user: 'Aytən X.', product: 'Dağ balı', location: 'Bakı', time: '2 dəq əvvəl', avatar: '🧑‍🦱' },
  { id: '2', type: 'purchase', user: 'Rauf M.', product: 'Kənd pendiri', location: 'Sumqayıt', time: '5 dəq əvvəl', avatar: '👨' },
  { id: '3', type: 'review', user: 'Günel S.', product: 'Qaymaq', location: 'Bakı', time: '8 dəq əvvəl', avatar: '👩' },
  { id: '4', type: 'purchase', user: 'Elnur K.', product: 'Ev yağı', location: 'Gəncə', time: '12 dəq əvvəl', avatar: '🧔' },
  { id: '5', type: 'view', user: 'Nigar A.', product: 'Gədəbəy şirəsi', location: 'Bakı', time: '15 dəq əvvəl', avatar: '👩‍🦰' },
]

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'sale', message: 'Gədəbəy balında 30% endirim!', time: '5 dəq əvvəl', read: false },
  { id: '2', type: 'order', message: 'Sifarişiniz yolda! 🚚', time: '15 dəq əvvəl', read: false },
  { id: '3', type: 'stock', message: 'Dağ pendiri yenidən stokda', time: '1 saat əvvəl', read: true },
]

export const WEATHER_SUGGESTIONS: Record<string, WeatherData> = {
  sunny: { condition: 'sunny', temp: 28, humidity: 45, suggestion: 'Günəşli gündə serinləmək üçün təbii meyvə sirkəsi sifariş et!' },
  cloudy: { condition: 'cloudy', temp: 18, humidity: 60, suggestion: 'Buludlu havada isti çay süfrəsi üçün bal & qaymaq sifariş et.' },
  rainy: { condition: 'rainy', temp: 14, humidity: 80, suggestion: 'Yağışlı gündə evdə qalmaq? İsti yemək üçün kənd məhsulları sifariş et!' },
  windy: { condition: 'windy', temp: 16, humidity: 55, suggestion: 'Soyuq küləkdə enerji üçün dağ balı & ev pendir tövsiyə edirik.' },
}