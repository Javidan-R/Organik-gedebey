import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { db } from '@/lib/db';
import { products, categories, productImages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { JsonLd } from '@/components/seo/JsonLd';

const HomePageClient = dynamic(
  () => import('./HomePageClient').then(mod => mod.HomePageClient),
  {
    loading: () => <div className="min-h-screen flex items-center justify-center">Yüklənir..</div>
  }
)

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Organik Gədəbəy – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq, Bəhməz, Sirkə',
  description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı, ekoloji təmiz kənd məhsulları. Azərbaycanın ən yaxşı organik məhsul mağazası. Pulsuz çatdırılma.',
  keywords: ['organik məhsullar', 'kənd məhsulları', 'Gədəbəy bal', 'təbii bal', 'qaymaq', 'pendir', 'bəhməz', 'sirkə', 'quru meyvə', 'dağ məhsulları', 'ekoloji məhsullar', 'əl istehsalı', 'Azərbaycan kənd məhsulları', 'təbii qida', 'organik bazar', 'Gədəbəy rayonu', 'səhər yeməyi', 'süd məhsulları', 'təbii çərəz', 'dağ balı', 'arı məhsulları', 'ev yeməyi', 'sağlam qida', 'online alış-veriş', 'kənd məhsulları satışı'],
  openGraph: {
    title: 'Organik Gədəbəy – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə. 100% təbii, əl istehsalı. Pulsuz çatdırılma.',
    images: ['/og-image.jpg'],
    type: 'website',
    locale: 'az_AZ',
  },
  alternates: {
    canonical: '/',
  },
};

async function getInitialData(): Promise<{
  products: any[];
  categories: any[];
}> {
  // Optimize: Only fetch active products, reduce relation payloads and keep the homepage fast
  const allProducts = await (db.query as any).products.findMany({
    where: eq(products.archived, false),
    with: {
      category: {
        columns: { id: true, name: true, slug: true, image: true },
      },
      images: {
        columns: { id: true, url: true, altText: true, displayOrder: true },
        orderBy: [desc(productImages.displayOrder)],
        limit: 4,
      },
      tags: true,
      variants: true,
    },
    orderBy: [desc(products.createdAt)],
    limit: 35,
  });
  const allCategories = await db.select().from(categories).where(eq(categories.archived, false));
  // Orders removed - not needed for storefront and causes performance issues
  return {
    products: allProducts,
    categories: allCategories,
  };
}
export default async function HomePage() {
  const initialData = await getInitialData();
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Organik Gədəbəy',
    url: 'https://organikgedebey.az',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı, ekoloji təmiz kənd məhsulları.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://organikgedebey.az/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Organik Gədəbəy',
    url: 'https://organikgedebey.az',
    logo: 'https://organikgedebey.az/organik_gedebey_logo.jpeg',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı, ekoloji təmiz kənd məhsulları. Azərbaycanın ən yaxşı organik məhsul mağazası.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gədəbəy',
      addressRegion: 'Gədəbəy Rayonu',
      addressCountry: 'AZ',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+994-XX-XXX-XX-XX',
      contactType: 'customer service',
      availableLanguage: 'Azerbaijani',
    },
    sameAs: [
      'https://www.facebook.com/organikgedebey',
      'https://www.instagram.com/organikgedebey',
    ],
  };

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Organik Gədəbəy',
    image: 'https://organikgedebey.az/organik_gedebey_logo.jpeg',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı, ekoloji təmiz kənd məhsulları.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gədəbəy',
      addressRegion: 'Gədəbəy Rayonu',
      addressCountry: 'AZ',
    },
    priceRange: '₺₺',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '08:00',
      closes: '23:00',
    },
    telephone: '+994-77-367-60-21',
    url: 'https://organikgedebey.az',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Məhsullarınız nə qədər təbii və ekoloji təmizdir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bütün məhsullarımız Gədəbəy dağlarından birbaşa gəlir, 100% təbii, əl istehsalı və ekoloji təmizdir. Heç bir kimyəvi əlavə və konservant istifadə olunmur.',
        },
      },
      {
        '@type': 'Question',
        name: 'Çatdırılma xidmətiniz varmı?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bəli, Gədəbəy daxilində pulsuz çatdırılma xidmətimiz var. Başqa bölgələrə 2-3 gündə çatdırılma edilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hansı məhsulları satırsınız?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr, süd məhsulları və digər təbii kənd məhsulları satırıq.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ödənişi necə edə bilərəm?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ödənişi karta nağd, online ödəniş və ya WhatsApp vasitəsilə edə bilərsiniz.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={faqJsonLd} />

        <HomePageClient initialData={initialData} />
    </>
  );
}