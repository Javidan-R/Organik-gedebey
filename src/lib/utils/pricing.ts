// lib/utils/pricing.ts

import { Product } from "../types";

/**
 * Məhsulun endirimli son qiymətini hesablayır.
 */
export const calculateFinalPrice = (product: Product, price: number): number => {
  const { discountType, discountValue } = product;
  
  if (!discountType || !discountValue || discountValue <= 0) {
    return price;
  }

  let finalPrice = price;

  if (discountType === 'percentage') {
    finalPrice = price * (1 - discountValue / 100);
  } else if (discountType === 'fixed') {
    finalPrice = price - discountValue;
  }
  
  return parseFloat(Math.max(0, finalPrice).toFixed(2));
};

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
