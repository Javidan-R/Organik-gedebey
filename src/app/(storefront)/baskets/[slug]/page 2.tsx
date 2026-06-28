import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { baskets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import BasketDetailClient from './BasketDetailClient';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const basket = await (db as any).query.baskets.findFirst({
      where: and(eq(baskets.slug, params.slug), eq(baskets.isActive, true)),
    });

    if (!basket) {
      return {
        title: 'Səbət Tapılmadı - Organik Gədəbəy',
      };
    }

    return {
      title: `${basket.name} - Organik Gədəbəy`,
      description: basket.tagline || basket.description || 'Təbii kənd məhsulları səbəti',
      openGraph: {
        title: basket.name,
        description: basket.tagline || basket.description,
        images: basket.media?.[0]?.url ? [basket.media[0].url] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Səbət - Organik Gədəbəy',
    };
  }
}

export async function generateStaticParams() {
  try {
    const allBaskets = await (db as any).query.baskets.findMany({
      where: and(eq(baskets.isActive, true), eq(baskets.archived, false)),
      columns: { slug: true },
      limit: 50, // Limit for static generation
    });

    return allBaskets.map((basket: any) => ({
      slug: basket.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function BasketDetailPage({ params }: PageProps) {
  try {
    const basket = await (db as any).query.baskets.findFirst({
      where: and(
        eq(baskets.slug, params.slug),
        eq(baskets.isActive, true),
        eq(baskets.archived, false)
      ),
      with: {
        media: true,
        variants: {
          with: {
            contents: true,
            extras: true,
          },
        },
      },
    }) as any;

    if (!basket) {
      notFound();
    }

    // View count artır (async, error ignore)
    db.update(baskets)
      .set({ 
        viewCount: (basket.viewCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(baskets.id, basket.id))
      .catch(() => {});

    return <BasketDetailClient basket={basket} />;
  } catch (error) {
    console.error('Error fetching basket:', error);
    notFound();
  }
}
