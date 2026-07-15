// src/app/category/[slug]/metadata.ts

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCategoryImageUrl } from '@/lib/category-helpers';
import { APP_CONFIG } from '@/lib/config';
import type { Category } from '@/types/category';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const category = (await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  })) as Category | undefined;

  if (!category) {
    return {
      title: 'Kateqoriya tapılmadı',
      description: 'Axtardığınız kateqoriya mövcud deyil.',
    };
  }

  const title = category.metaTitle || `${category.name} - ${APP_CONFIG.siteName}`;
  const description =
    category.metaDescription ||
    category.description ||
    `${category.name} kateqoriyasında ən təzə və keyfiyyətli məhsullar.`;
  const imageUrl = getCategoryImageUrl(category);

  return {
    title,
    description,
    keywords:
      category.metaKeywords ||
      `${category.name}, organik məhsullar, təbii qidalar, sağlam qidalanma`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/category/${category.slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
      siteName: APP_CONFIG.siteName,
      locale: 'az_AZ',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      site: APP_CONFIG.twitterSite,
    },
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: APP_CONFIG.googleVerification,
    },
    applicationName: APP_CONFIG.siteName,
    authors: [{ name: APP_CONFIG.author }],
    category: category.name,
  };
}