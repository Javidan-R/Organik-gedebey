// src/components/seo/CategorySchema.tsx

'use client';

import { useEffect } from 'react';
import type { Category } from '@/types/category';

interface CategorySchemaProps {
  category: Category;
  products: any[];
  breadcrumbs: { name: string; url: string }[];
}

export function CategorySchema({ category, products, breadcrumbs }: CategorySchemaProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !category) return;

    // JSON-LD məlumatlarını yarat
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.description || '',
      url: `${window.location.origin}/category/${category.slug}`,
      image: category.imageUrl || '',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${window.location.origin}${item.url}`,
        })),
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: products.slice(0, 10).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.images?.[0]?.url || '',
            sku: product.sku || product.id,
            offers: {
              '@type': 'Offer',
              price: product.price || product.basePrice,
              priceCurrency: 'AZN',
              availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          },
        })),
      },
    };

    // HTML-ə əlavə et
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((s) => {
        if (s.textContent === JSON.stringify(schema)) {
          s.remove();
        }
      });
    };
  }, [category, products, breadcrumbs]);

  return null;
}