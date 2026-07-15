// src/components/seo/ProductStructuredData.tsx
import type { Product } from "@/types/products";

export function ProductStructuredData({ product }: { product: Product }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? "",
    image: product.images?.map((img) => img.url) ?? [],
    sku: product.slug,
    offers: {
      "@type": "Offer",
      price: product.variants?.[0]?.price ?? product.price ?? 0,
      priceCurrency: "AZN",
      availability:
        product.variants?.some((v) => (v.stock ?? 0) > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://gedebey.az/products/${product.slug}`,
    },
    aggregateRating: product.reviews?.length
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            product.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) /
            product.reviews.length
          ).toFixed(1),
          reviewCount: product.reviews.length,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}