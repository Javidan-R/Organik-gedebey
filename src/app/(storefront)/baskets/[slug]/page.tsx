// src/app/(storefront)/baskets/[slug]/page.tsx
// Tək səbət detail səhifəsi

import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { baskets, basketMedia, basketVariants, basketContents, basketExtras } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface Props {
  params: { slug: string }
}

export default async function BasketDetailPage({ params }: Props) {
  const basket = await (db.query as any).baskets.findFirst({
    where: eq(baskets.slug, params.slug),
    with: {
      media: {
        orderBy: [basketMedia.displayOrder]
      },
      variants: {
        with: {
          contents: {
            orderBy: [basketContents.displayOrder]
          },
          extras: {
            orderBy: [basketExtras.displayOrder]
          }
        }
      }
    }
  })

  if (!basket || basket.archived) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <h1 className="text-4xl font-bold">{basket.name}</h1>
      <p className="text-lg text-gray-600 mt-4">{basket.description}</p>
      
      {/* TODO: Detail page UI əlavə etmək */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Variantlar</h2>
        {basket.variants?.map((variant: any) => (
          <div key={variant.id} className="p-4 border rounded-lg mb-4">
            <h3 className="font-bold capitalize">{variant.variant}</h3>
            <p className="text-lg">Qiymət: {variant.price} AZN</p>
            {variant.contents && variant.contents.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold">Məzmun:</h4>
                <ul className="list-disc list-inside">
                  {variant.contents.map((content: string, idx: number) => (
                    <li key={idx}>{content}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
