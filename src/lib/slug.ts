export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-əğçşıöü]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Generate a unique slug by appending a random string if needed
 * @param baseName - The base name to slugify
 * @returns A unique slug
 */
export const generateUniqueSlug = (baseName: string): string => {
  const baseSlug = slugify(baseName);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};
 