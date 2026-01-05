import { Product } from '@/types/products';
import { productDisplayPrice } from './calc';

export type ProductFilter = {
  q?: string;
  categoryId?: string;
  origin?: 'Gədəbəy' | 'Gəncə' | 'Şəkir' | 'Tovuz' | 'Digər';
  onlyNew?: boolean;
  onlyDiscounted?: boolean;
  sort?: 'new' | 'price-asc' | 'price-desc';
};

export const applyProductFilter = (list: Product[], f: ProductFilter) => {
  let items = [...list].filter((p) => !p.archived);

  if (f.q) {
    const s = f.q.trim().toLowerCase();
    items = items.filter((p) => {
      const slug = (p as Product & { slug?: string }).slug;
      return p.name.toLowerCase().includes(s) || (typeof slug === 'string' && slug.toLowerCase().includes(s));
    });
  }
  if (f.categoryId) items = items.filter((p) => p.categoryId === f.categoryId);
  if (f.origin) items = items.filter((p) => p.origin === f.origin);
  if (f.onlyDiscounted) items = items.filter((p) => !!p.discountType && !!p.discountValue);

  if (f.sort === 'price-asc')
    items.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b));
  else if (f.sort === 'price-desc')
    items.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a));
  
  return items;
};
