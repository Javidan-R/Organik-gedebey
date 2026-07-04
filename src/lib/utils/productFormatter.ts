// src/lib/utils/productFormatter.ts

/**
 * Məhsul məlumatlarını frontend-in gözlədiyi formata çevirir.
 * Variant: basePrice → price, basePrice silinir
 * Images: altText → alt, altText silinir
 * Tags: { id, productId, tag, createdAt } → string[]
 * 
 * Həmçinin:
 * - Decimal sahələri number-a çevirir
 * - Null dəyərləri undefined-ə çevirir (frontend üçün təhlükəsiz)
 * - Stok məlumatlarını hesablayır
 */
export function formatProductWithRelations(product: any) {
  if (!product) return null;

  // Decimal → Number çevir
  const toNumber = (val: any) => {
    if (val === null || val === undefined) return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  };

  // Variantları formatla
  const variants = (product.variants || []).map((v: any) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: toNumber(v.basePrice) ?? 0,
    costPrice: toNumber(v.costPrice),
    arrivalCost: toNumber(v.arrivalCost),
    stock: v.stock ?? 0,
    minStock: v.minStock ?? 10,
    unit: v.unit ?? 'ədəd',
    grade: v.grade ?? 'A',
    batchDate: v.batchDate,
    isDefault: v.isDefault ?? false,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));

  // Ümumi stok hesabla
  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

  // İlk variantın qiyməti (əsas qiymət kimi)
  const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0];

  // Şəkilləri formatla
  const images = (product.images || []).map((img: any) => ({
    id: img.id,
    url: img.url,
    alt: img.altText || product.name || 'Məhsul şəkli',
    displayOrder: img.displayOrder ?? 0,
  })).sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Etiketləri formatla (string array)
  const tags = (product.tags || []).map((t: any) => t.tag);

  // Rəyləri formatla
  const reviews = (product.reviews || []).map((r: any) => ({
    id: r.id,
    name: r.user?.name || r.name || 'İstifadəçi',
    rating: r.rating ?? 0,
    text: r.comment || r.text || '',
    createdAt: r.createdAt,
    isApproved: r.isApproved ?? true,
  })).filter((r: any) => r.isApproved);

  // Kateqoriya məlumatı
  const category = product.category ? {
    id: product.category.id,
    name: product.category.name,
    slug: product.category.slug,
  } : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    categoryId: product.categoryId,
    category,
    
    // Qiymət məlumatları
    price: defaultVariant?.price ?? toNumber(product.basePrice) ?? 0,
    basePrice: toNumber(product.basePrice) ?? 0,
    costPrice: toNumber(product.costPrice),
    
    // Stok məlumatları
    stock: totalStock,
    totalStock,
    variants,
    minStock: product.minStock ?? 10,
    unit: product.unit ?? 'ədəd',
    grade: product.grade ?? 'A',
    
    // Endirim məlumatları
    discountType: product.discountType,
    discountValue: toNumber(product.discountValue),
    discountStart: product.discountStart,
    discountEnd: product.discountEnd,
    
    // Media
    images,
    video: product.video,
    
    // Etiketlər
    tags,
    
    // Mənşə
    origin: product.origin,
    originRegion: product.originRegion,
    supplier: product.supplier,
    
    // Keyfiyyət
    isOrganic: product.isOrganic ?? false,
    isGlutenFree: product.isGlutenFree ?? false,
    isVegan: product.isVegan ?? false,
    isFeatured: product.isFeatured ?? false,
    isNewArrival: product.isNewArrival ?? false,
    isSeasonal: product.isSeasonal ?? false,
    featured: product.isFeatured ?? false,
    seasonal: product.isSeasonal ?? false,
    
    // Rəylər
    reviews,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
      : 0,
    reviewCount: reviews.length,
    
    // SEO
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    metaKeywords: product.metaKeywords,
    
    // Qida dəyəri
    caloriesPer100g: toNumber(product.caloriesPer100g),
    proteinPer100g: toNumber(product.proteinPer100g),
    carbsPer100g: toNumber(product.carbsPer100g),
    fatPer100g: toNumber(product.fatPer100g),
    
    // Saxlanma
    shelfLifeDays: toNumber(product.shelfLifeDays),
    storageConditions: product.storageConditions,
    
    // Status
    archived: product.archived ?? false,
    statusTags: product.tags?.map((t: any) => t.tag) || [],
    
    // Statistika
    viewCount: product.viewCount ?? 0,
    soldCount: product.soldCount ?? 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Bir neçə məhsulu formatla
 */
export function formatProducts(products: any[]) {
  return products.map((p) => formatProductWithRelations(p));
}

/**
 * Stok vəziyyətinə görə məhsulun statusunu qaytarır
 */
export function getProductStockStatus(product: any): 'in_stock' | 'low_stock' | 'out_of_stock' {
  const stock = product.totalStock ?? product.stock ?? 0;
  const minStock = product.minStock ?? 5;
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
}