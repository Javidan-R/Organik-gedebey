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
    { price: number; contents: string[]; extras?: string[] }
  >;
  highlights?: string[];
}
