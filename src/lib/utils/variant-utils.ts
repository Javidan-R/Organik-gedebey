// src/lib/utils/variant-utils.ts
import { db } from '@/lib/db';
import { products, productVariants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface ResolvedVariant {
  variantId: string;
  productId: string;
  price: number;
  stock: number;
  costPrice?: number;
  unit: string;
  isDefault: boolean;
  isProductFallback: boolean;
}

export async function resolveVariant(
  productId: string,
  variantId: string | null | undefined
): Promise<ResolvedVariant> {
  const isUuid =
    variantId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantId);

  if (isUuid) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      with: { product: true },
    });
    if (variant) {
      return {
        variantId: variant.id,
        productId: variant.productId,
        price: parseFloat(variant.basePrice || '0'),
        stock: variant.stock || 0,
        costPrice: variant.costPrice ? parseFloat(variant.costPrice) : undefined,
        unit: variant.unit || 'ədəd',
        isDefault: variant.isDefault || false,
        isProductFallback: false,
      };
    }
  }

  const defaultVariant = await db.query.productVariants.findFirst({
    where: and(eq(productVariants.productId, productId), eq(productVariants.isDefault, true)),
    with: { product: true },
  });

  if (defaultVariant) {
    return {
      variantId: defaultVariant.id,
      productId: defaultVariant.productId,
      price: parseFloat(defaultVariant.basePrice || '0'),
      stock: defaultVariant.stock || 0,
      costPrice: defaultVariant.costPrice ? parseFloat(defaultVariant.costPrice) : undefined,
      unit: defaultVariant.unit || 'ədəd',
      isDefault: true,
      isProductFallback: false,
    };
  }

  const anyVariant = await db.query.productVariants.findFirst({
    where: eq(productVariants.productId, productId),
    with: { product: true },
    orderBy: (variants, { asc }) => [asc(variants.createdAt)],
  });

  if (anyVariant) {
    return {
      variantId: anyVariant.id,
      productId: anyVariant.productId,
      price: parseFloat(anyVariant.basePrice || '0'),
      stock: anyVariant.stock || 0,
      costPrice: anyVariant.costPrice ? parseFloat(anyVariant.costPrice) : undefined,
      unit: anyVariant.unit || 'ədəd',
      isDefault: anyVariant.isDefault || false,
      isProductFallback: false,
    };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  return {
    variantId: productId,
    productId: product.id,
    price: parseFloat(product.basePrice || '0'),
    stock: 0,
    costPrice: product.costPrice ? parseFloat(product.costPrice) : undefined,
    unit: product.unit || 'ədəd',
    isDefault: true,
    isProductFallback: true,
  };
}

export function validateStock(variant: ResolvedVariant, requestedQty: number): boolean {
  return variant.stock >= requestedQty;
}