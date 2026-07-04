// src/app/api/cart/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, productVariants, users } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { z } from 'zod';
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt';

const itemSchema = z.object({
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  isCustom: z.boolean().default(false),
  customName: z.string().min(1).optional(),
  estimatedPrice: z.number().min(0).optional(),
  note: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
}).refine(
  (v) => (v.isCustom ? !!v.customName : !!v.productId),
  { message: 'Kataloq məhsulu üçün productId, xüsusi məhsul üçün customName tələb olunur' }
);

const submitSchema = z.object({
  customerPhone: z.string().min(7, 'Telefon nömrəsi tələb olunur'),
  customerNote: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Ən azı bir məhsul əlavə edin'),
});

async function getUserId(request: NextRequest): Promise<string | null> {
  const cookie = request.cookies.get(COOKIE_CUSTOMER);
  if (!cookie?.value) return null;
  const payload = await verifyCustomerToken(cookie.value);
  return payload?.sub || null;
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sorğu göndərmək üçün daxil olmalısınız' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasiya xətası', details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // ✅ Kataloq məhsullarının mövcudluğunu və qiymətini əvvəlcədən yoxlayırıq (N+1 əvəzinə inArray)
    const catalogItems = data.items.filter((i) => !i.isCustom && i.productId);
    const productIds = [...new Set(catalogItems.map((i) => i.productId!))];
    const variantIds = [...new Set(catalogItems.map((i) => i.variantId).filter(Boolean))] as string[];

    const [productRows, variantRows] = await Promise.all([
      productIds.length
        ? db.select().from(products).where(and(inArray(products.id, productIds), eq(products.archived, false)))
        : Promise.resolve([]),
      variantIds.length
        ? db.select().from(productVariants).where(inArray(productVariants.id, variantIds))
        : Promise.resolve([]),
    ]);

    const productMap = new Map(productRows.map((p) => [p.id, p]));
    const variantMap = new Map(variantRows.map((v) => [v.id, v]));

    // Mövcud olmayan/arxivlənmiş məhsulları rədd edirik
    for (const item of catalogItems) {
      if (!productMap.has(item.productId!)) {
        return NextResponse.json(
          { error: `Seçdiyiniz məhsullardan biri artıq mövcud deyil (${item.productId})` },
          { status: 400 }
        );
      }
    }

    // ✅ Təxmini məbləği hesablayırıq
    let totalEstimated = 0;
    for (const item of data.items) {
      if (item.isCustom) {
        totalEstimated += (item.estimatedPrice ?? 0) * item.quantity;
      } else {
        const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
        const product = productMap.get(item.productId!);
        const price = variant?.basePrice != null
          ? Number(variant.basePrice)
          : Number(product?.basePrice ?? 0);
        totalEstimated += price * item.quantity;
      }
    }

    const result = await db.transaction(async (tx) => {
      const [cart] = await tx
        .insert(carts)
        .values({
          userId,
          status: 'submitted',
          customerPhone: data.customerPhone,
          customerNote: data.customerNote ?? null,
          totalEstimated: totalEstimated.toFixed(2),
          submittedAt: new Date(),
        })
        .returning();

      await tx.insert(cartItems).values(
        data.items.map((item) => ({
          cartId: cart.id,
          productId: item.isCustom ? null : item.productId ?? null,
          variantId: item.isCustom ? null : item.variantId ?? null,
          isCustom: item.isCustom,
          customName: item.isCustom ? item.customName : null,
          estimatedPrice: item.isCustom && item.estimatedPrice != null ? String(item.estimatedPrice) : null,
          quantity: item.quantity,
          note: item.note ?? null,
        }))
      );

      return cart;
    });

    // ✅ Adminlərə bildiriş (best-effort — sizin `notifications` sxeminizin sütun adlarına uyğunlaşdırın)
    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ['ADMIN', 'SUPERADMIN', 'MANAGER'] as any));

      if (admins.length > 0) {
        const { notifications } = await import('@/lib/db/schema');
        await db.insert(notifications).values(
          admins.map((a) => ({
            userId: a.id,
            type: 'custom_basket',
            refId: result.id,
            text: `Yeni "Öz Səbətini Qur" sorğusu — təxmini ${totalEstimated.toFixed(2)} ₼`,
            read: false,
          }))
        );
      }
    } catch (notifyError) {
      // Bildiriş sxemi fərqli ola bilər — əsas axını bloklamırıq, sadəcə loglayırıq.
      console.warn('[cart/submit] Bildiriş yaradıla bilmədi:', notifyError);
    }

    return NextResponse.json({ cart: result }, { status: 201 });
  } catch (error) {
    console.error('Cart submit error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}