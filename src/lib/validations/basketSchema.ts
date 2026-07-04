// src/lib/validations/basketSchema.ts
import { z } from 'zod';

export const basketTypeEnum = z.enum(['seher', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']);
export const basketVariantEnum = z.enum(['econom', 'standard', 'premium']);

export const mediaItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['image', 'video']),
  url: z.string().url('URL keçərli deyil'),
  altText: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
});
 
export const basketVariantSchema = z.object({
  id: z.string().optional(),
  variant: basketVariantEnum,
  price: z.string().or(z.number()).transform(v => String(v)),
  originalPrice: z.string().or(z.number()).optional().transform(v => v ? String(v) : undefined),
  stock: z.number().int().min(0).default(0),
  contents: z.array(z.string()).default([]),
  extras: z.array(z.string()).default([]),
});

export const basketSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Ad minimum 3 simvol'),
  slug: z.string().min(1, 'Slug tələb olunur').regex(/^[a-z0-9-]+$/, 'Slug yalnız kiçik hərf, rəqəm və tire ola bilər'),
  tagline: z.string().optional(),
  description: z.string().min(10, 'Təsvir minimum 10 simvol'),
  type: basketTypeEnum,
  servings: z.string().optional(),
  unit: z.string().default('səbət'),
  origin: z.string().optional(),
  freshness: z.string().optional(),
  nutrition: z.array(z.string()).default([]),
  bestseller: z.boolean().default(false),
  trending: z.boolean().default(false),
  new: z.boolean().default(false),
  lowStock: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  discount: z.number().int().min(0).max(100).default(0),
  highlights: z.array(z.string()).default([]),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  archived: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  media: z.array(mediaItemSchema).default([]),
  variants: z.array(basketVariantSchema).min(1, 'Ən azı 1 variant olmalıdır'),
});

export type BasketInput = z.infer<typeof basketSchema>;
export type Basket = BasketInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  soldCount?: number;
};