// src/app/(storefront)/about-us/page.tsx
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { aboutUsSections, aboutUsRegions, aboutUsStats } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { cache } from 'react';
import { AboutUsClient } from './AboutUsClient';

export interface Section {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  sectionType: string;
  metadata: any;
}

export interface Region {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  featuredProducts: string[] | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
}

const getAboutUsData = cache(async () => {
  const [rawSections, rawRegions, rawStats] = await Promise.all([
    db
      .select()
      .from(aboutUsSections)
      .where(eq(aboutUsSections.isActive, true))
      .orderBy(asc(aboutUsSections.displayOrder)),
    db
      .select()
      .from(aboutUsRegions)
      .where(eq(aboutUsRegions.isActive, true))
      .orderBy(asc(aboutUsRegions.displayOrder)),
    db
      .select()
      .from(aboutUsStats)
      .where(eq(aboutUsStats.isActive, true))
      .orderBy(asc(aboutUsStats.displayOrder)),
  ]);

  // DB‑dən gələn nullable sahələri interfeysə uyğunlaşdır
  const sections: Section[] = rawSections.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle ?? null,
    description: s.description ?? '',
    imageUrl: s.imageUrl ?? null,
    videoUrl: s.videoUrl ?? null,
    displayOrder: s.displayOrder ?? 0,
    isActive: s.isActive ?? false,
    sectionType: s.sectionType,
    metadata: s.metadata ?? null,
  }));

  const regions: Region[] = rawRegions.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    imageUrl: r.imageUrl ?? null,
    featuredProducts: r.featuredProducts ?? null,
    displayOrder: r.displayOrder ?? 0,
    isActive: r.isActive ?? false,
  }));

  const stats: Stat[] = rawStats.map((st) => ({
    id: st.id,
    label: st.label,
    value: st.value,
    description: st.description ?? null,
    icon: st.icon ?? null,
    displayOrder: st.displayOrder ?? 0,
    isActive: st.isActive ?? false,
  }));

  return { sections, regions, stats };
});

export async function generateMetadata(): Promise<Metadata> {
  const { sections } = await getAboutUsData();
  const heroSection = sections.find((s) => s.sectionType === 'hero');
  const siteTitle = 'Yaylaq';

  const title = heroSection?.title || `Haqqımızda | ${siteTitle}`;
  const description =
    heroSection?.description ||
    `${siteTitle} – təbii kənd məhsulları, birbaşa fermerlərdən süfrənizə.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: heroSection?.imageUrl ? [heroSection.imageUrl] : [],
    },
  };
}

export default async function AboutUsPage() {
  const { sections, regions, stats } = await getAboutUsData();
  return <AboutUsClient sections={sections} regions={regions} stats={stats} />;
}