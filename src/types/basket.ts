export type BasketVariant = "econom" | "standard" | "premium";

export interface BasketItem {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  type: string;
  servings: string;
  unit: string;
  media: { type: "image" | "video"; src: string }[];
  lowStock?: boolean;
  variants: Record<
    BasketVariant,
    { price: number; originalPrice?: number; contents: string[]; extras?: string[] }
  >;
  highlights?: string[];
  origin?: string;
  freshness?: string;
  bestseller?: boolean;
  new?: boolean;
  trending?: boolean;
  nutrition?: string[];
  testimonials?: Array<{ name: string; text: string; rating: number }>;
}
