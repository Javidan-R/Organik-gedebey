
export interface ProductBadge {
  label: string
  tone: 'green' | 'amber' | 'rose' | 'blue' | 'purple'
}
 
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

export interface NotificationItem {
  id: string
  type: 'sale' | 'stock' | 'order' | 'promo'
  message: string
  time: string
  read: boolean
}

export interface GamificationData {
  points: number
  level: number
  nextLevelPoints: number
  badges: string[]
  streak: number
}

export interface LiveActivity {
  id: string
  type: 'purchase' | 'view' | 'review'
  user: string
  product: string
  location: string
  time: string
  avatar: string
}

export interface WeatherData {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy'
  temp: number
  humidity: number
  suggestion: string
}