import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { generateUniqueSlug } from '@/lib/slug'

export async function GET() {
  try {
    const cats = await db.query.categories.findMany({
      // Arxivlənməmiş və aktiv olan kateqoriyaları gətiririk
      where: and(eq(categories.archived, false), eq(categories.isActive, true)),
      with: {
        products: {
          columns: {
            id: true // Sayı hesablamaq üçün bütün məhsul obyektini yox, sadəcə id-ləri çəkirik
          }
        }
      },
      orderBy: [desc(categories.isFeatured), desc(categories.name)],
    })

    // Məhsul sayını manual olaraq obyektə əlavə edirik
    const formattedCats = cats.map(cat => ({
      ...cat,
      productsCount: cat.products?.length || 0
    }))

    return NextResponse.json(formattedCats)
  } catch (error) {
    logger.error('GET /api/categories error:', { error })
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Sizin schema.ts-də sütun adı 'imageUrl' olaraq təyin edilib
    const [newCat] = await db.insert(categories).values({
      name: body.name,
      slug: body.slug || generateUniqueSlug(body.name),
      imageUrl: body.imageUrl || body.image || null, // Sütun adı imageUrl-dir
      description: body.description || null,
      isFeatured: body.isFeatured || false,
      isActive: body.isActive ?? true,
      displayOrder: body.displayOrder || 0,
    }).returning()

    return NextResponse.json(newCat, { status: 201 })
  } catch (error) {
    logger.error('POST /api/categories error:', { error })
    return NextResponse.json({ error: 'Kateqoriya yaradıla bilmədi' }, { status: 500 })
  }
}