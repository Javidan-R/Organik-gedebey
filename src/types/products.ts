export type ProductImage = {
  id?: string;                         // Drag & drop və silmək üçün lazım
  url?: string;                        // Şəklin URL-i (local object URL və ya remote link)
  alt?: string;                       // SEO alt text
  source?: 'upload' | 'url';         // Hansı yolla əlavə edilib (optional, amma faydalıdır)
};

export type ID = string;

export type ProductCardViewMode = 'grid' | 'list';

export type UnitType = 
  | 'ədəd'
  | 'kq'
  | 'qram'
  | 'litr'
  | 'ml'
  | 'qutu'
  | 'paket'
  | 'balon'
  | 'meşov'
  | 'paket'
  ;
/** Məhsulun xüsusi statusları – Front-end tərəfdə göstəriləcək. */
export type ProductStatus = 'featured' | 'newArrival' | 'seasonal' | 'organic' | 'bestValue' | 'limitedEdition' | 'mustTry' | 'ecoFriendly' | 'locallySourced' ;
/** Məhsulun Keyfiyyət Çeşidi (Grade) */
export type ProductGrade = 'A' | 'B' | 'C' | 'Unsorted';
// --- Məhsulun Qidalanma Məlumatı üçün Struktur ---
export type NutritionalFact = {
    key: 'calories' | 'protein' | 'fat' | 'carbs' | 'fiber' | 'sugar' | 'salt' | string;
    value: string; // Məsələn: '100 kcal', '5g'
    unit?: UnitType; // Məsələn: '100g' üçün
};

// --- Məhsulun Çeşidi (Variant) ---
export type Variant = {
    id: ID;
    name: string;
    sku?: string;
    price: number;
    /** Çeşidin maya dəyəri – maliyyə hesabatı üçün əsas */
    costPrice : number; // Əvvəlki adı
    arrivalCost?: number; // Daşıma xərci daxil olmaqla ümumi maya dəyəri
    /** Bu çeşidin keyfiyyət dərəcəsi (Grade) */
    grade: ProductGrade; 
    createdAt: string;
    // Stok idarəetməsi
    stock: number;
    minStock: number;
    length?: number; // cm
    // Təzəlik İdarəetməsi (Batch/Lot)
    /** Bu stok partiyasının (lot) daxil olma/istehsal tarixi (FIFO üçün vacibdir) */
    batchDate: string; 
    // Əlavə Məlumat
    allergens?: string[]; // Məsələn: ['Fındıq', 'Qlüten']
    weight?: number; // Məsələn: 0.5 (kg)
    unit?: UnitType; // Məsələn: 'kg', 'ədəd', 'litr'
    nutritionalFacts?: NutritionalFact[];
    colorHex?: string; // Məsələn: '#FF5733' (rəngli məhsullar üçün)
};
// --- Review ---
export type Review = {
    id: ID;
    productId: ID;
    name: string;
    text: string;
    rating: number;
    approved: boolean;
    createdAt: string;
};
// --- Product ---
export type Product = {
  stock: number;
    id: ID;
    name: string;
    slug: string;
    description: string;
    metaDescription?: string;
    categoryId: ID;
    tags: string[];
    metaTitle?: string;
    // DÜZƏLİŞ: Şəkil tipləri daha ətraflı olmalıdır (alt-text üçün)
    images: ProductImage[];
    video?: string;
    origin?: string;
    originRegion?: string;
    organic?: boolean;
    seasonal?: boolean;
    featured?: boolean;
    statusTags?: ProductStatus[];
    discountType?: "percentage" | "fixed" ;
    discountValue?: number;
    discountStart?: string;
    discountEnd?: string;
    costPrice?: number;
    minStock?: number;
    price?: number;
grade?: ProductGrade;
    reviews?: Review[];
    archived?: boolean;
    createdAt: string;
unit?: UnitType; // Məsələn: 'kg', 'ədəd', 'litr'
    weight?: number; // Məsələn: 0.5 (kg)
    variants: Variant[];
    shelfLifeDays?: number; // Saxlama müddəti (günlərlə)
    // ƏLAVƏ: store.ts-də istifadə olunan sahə (Key-Value attributları)
    attributes?: { key: string, value: string }[];
nutritionalFacts?: NutritionalFact[];
benefits?: string[]; // Front-end üçün sadə faydalar siyahısı
    usageTips?: string[];
    certificates?: string[];
    allergens?: string[];
    storageNotes?: string[];
    updatedAt?: string;
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];

    /** Minimum satıla bilən miqdar vahidi addımı (Məsələn: 1 kq üçün 1; 500qram üçün 0.5) */
  quantityStep: number; // YENİ SAHƏ
};

export type CartItem = {
    productId: ID;
    variantId?: ID;
    qty: number;
};

export type ProductCardProps = {
  p: Product;
  categoryMap: Record<ID, string>;
  setEditingProduct: (p: Product | null) => void;
  archiveProduct: (id: ID) => void;
  unarchiveProduct: (id: ID) => void;
  viewMode?: ProductCardViewMode;
};



export type ProductEditModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Product | null;
};

export type TabKey =
  | 'basic'
  | 'stock'
  | 'media'
  | 'labels'
  | 'discount'
  | 'benefits'
  | 'reviews'
  | 'settings';

// Initial builder


export type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'slate' | 'green' | 'red' | 'amber' | 'purple';
  helperText?: string;
  isHighValue?: boolean; // Dəyəri vurğulamaq üçün (Məsələn: Mənfəət)
};



// Skeleton grid – hydration vaxtı
export type SkeletonProps = {
  viewMode: ProductCardViewMode;
};
