// src/lib/utils/slug.ts
// Slugify funksiyası – Azərbaycan hərfləri üçün təkmilləşdirilmiş versiya

/**
 * Mətni URL-dostu slug-a çevirir.
 * Azərbaycan hərflərini transliterasiya edir, xüsusi simvolları təmizləyir.
 */
export function slugify(text: string): string {
  if (!text) return '';

  // Azərbaycan hərflərinin transliterasiyası
  const azMap: Record<string, string> = {
    'ə': 'e',
    'ü': 'u',
    'ö': 'o',
    'ı': 'i',
    'ğ': 'g',
    'ş': 's',
    'ç': 'c',
    'Ə': 'e',
    'Ü': 'u',
    'Ö': 'o',
    'I': 'i',
    'Ğ': 'g',
    'Ş': 's',
    'Ç': 'c',
  };

  let slug = text
    // Azərbaycan hərflərini dəyiş
    .replace(/[əƏ]/g, (m) => azMap[m] || m)
    .replace(/[üÜ]/g, (m) => azMap[m] || m)
    .replace(/[öÖ]/g, (m) => azMap[m] || m)
    .replace(/[ıI]/g, (m) => azMap[m] || m)
    .replace(/[ğĞ]/g, (m) => azMap[m] || m)
    .replace(/[şŞ]/g, (m) => azMap[m] || m)
    .replace(/[çÇ]/g, (m) => azMap[m] || m)
    // Qalan hərfləri kiçildir
    .toLowerCase()
    // Yalnız hərf, rəqəm və tire burax
    .replace(/[^a-z0-9\s-]/g, '')
    // Boşluqları tire ilə əvəz et
    .trim()
    .replace(/\s+/g, '-')
    // Ardıcıl tireləri təkə endir
    .replace(/-+/g, '-')
    // Baş və son tireləri sil
    .replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Unikal slug yaradır (mövcud slug-ları nəzərə alır)
 */
export function generateUniqueSlug(base: string, existingSlugs: string[] = []): string {
  let slug = slugify(base);
  let counter = 1;
  let uniqueSlug = slug;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}