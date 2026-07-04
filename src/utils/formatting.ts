/**
 * Centralized Formatting Utilities
 * All formatting functions to prevent code duplication
 */
 
import { DiscountType } from '@/lib/types';

// ============================================================================
// CURRENCY & NUMBER FORMATTING
// ============================================================================


/**
 * Premium currency formatter with Azerbaijani localization
 * Supports custom decimal precision
 */
export const currency = (
  value?: number | null,
  minDecimals: number = 2,
  maxDecimals: number = 2,
): string => {
  if (value === undefined || value === null) return '0.00 ₼';
  
  const v = Number(value);
  if (isNaN(v) || !isFinite(v)) return '0.00 ₼'; 

  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(v).replace('AZN', '₼');
};
/**
 * Simple currency formatter (legacy compatibility)
 */
export function formatCurrency(value: number, currencySymbol: string = '₼'): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return `0.00 ${currencySymbol}`;
  return `${value.toFixed(2)} ${currencySymbol}`;
}



/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number, locale: string = 'az-AZ'): string {
  if (!isFinite(value)) return '0';
  return new Intl.NumberFormat(locale).format(value);
}


// ============================================================================
// DISCOUNT FORMATTING
// ============================================================================

/**
 * Format discount based on type
 */
export function formatDiscount(
  type: DiscountType,
  value: number,
): string {
  if (type === 'percentage') {
    return `-${value}%`;
  }
  if (type === 'fixed') {
    return `-${currency(value, 0)} (sabit)`;
  }
  return '';
}



// ============================================================================
// WEIGHT & MEASUREMENT FORMATTING
// ============================================================================

/**
 * Format weight in kg or grams
 */
export function formatWeight(weight: number | null | undefined): string {
  if (weight === null || weight === undefined || isNaN(weight)) return '0 kq';
  if (weight >= 1) {
    return `${weight.toFixed(3)} kq`;
  }
  const grams = Math.round(weight * 1000);
  return `${grams} q`;
}

/**
 * Format volume in liters
 */
export function formatVolume(liters: number | null | undefined): string {
  if (liters === null || liters === undefined || isNaN(liters)) return '0 L';
  if (liters >= 1) {
    return `${liters.toFixed(2)} L`;
  }
  const ml = Math.round(liters * 1000);
  return `${ml} ml`;
}

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Format date in Azerbaijani locale
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: options?.hour ? '2-digit' : undefined,
    minute: options?.minute ? '2-digit' : undefined,
  };

  return date.toLocaleDateString('az-AZ', { ...defaultOptions, ...options });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'indi';
  if (diffMins < 60) return `${diffMins} dəqiqə əvvəl`;
  if (diffHours < 24) return `${diffHours} saat əvvəl`;
  if (diffDays < 7) return `${diffDays} gün əvvəl`;
  return formatDate(dateString);
}

/**
 * Format time only
 */
export function formatTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Slugify text for URLs
 * Handles Azerbaijani characters
 */
export function slugify(text: string): string {
  const charMap: Record<string, string> = {
    ə: 'e', Ə: 'e',
    ö: 'o', Ö: 'o',
    ü: 'u', Ü: 'u',
    ğ: 'g', Ğ: 'g',
    ş: 's', Ş: 's',
    ç: 'c', Ç: 'c',
    ı: 'i', I: 'i',
  };

  return text
    .toLowerCase()
    .replace(/[əöüğşçı]/g, (m) => charMap[m] || m)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+994 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// ============================================================================
// MATH & CLAMPING
// ============================================================================

/**
 * Clamp value between min and max
 */
export const clamp = (
  value: number,
  min: number = 0,
  max: number = 100,
): number => {
  return Math.max(min, Math.min(value, max));
};

/**
 * Safe value clamping (0-100)
 */
export const safeVal = (value: number): number => clamp(value, 0, 100);

/**
 * Round to decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  return Number(value.toFixed(decimals));
}

// ============================================================================
// ID FORMATTING
// ============================================================================

/**
 * Shorten ID for display
 */
export function shortId(id: string, length: number = 6): string {
  if (!id) return '#000000';
  return `#${id.slice(0, length).toUpperCase()}`;
}

// ============================================================================
// ARRAY FORMATTING
// ============================================================================

/**
 * Format array as comma-separated list
 */
export function formatList(items: string[], conjunction: string = 'və'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(` ${conjunction} `);
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}
