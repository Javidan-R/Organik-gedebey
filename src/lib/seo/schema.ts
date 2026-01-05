// lib/seo/schema.ts
export const productJsonLd = (p: any, price: number) => ({
  "@context": "https://schema.org/",
  "@type": "Product",
  name: p.name,
  image: p.images?.slice(0,4) || [],
  description: p.description,
  brand: "Organik Gədəbəy",
  sku: p.variants?.[0]?.sku || p.slug,
  offers: {
    "@type": "Offer",
    priceCurrency: "AZN",
    price,
    availability: (p.variants?.[0]?.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
  },
})
