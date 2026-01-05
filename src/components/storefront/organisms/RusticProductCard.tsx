"use client";

import { getProductBasePrice, getFirstImageUrl, formatCurrency } from "@/app/(storefront)/page";
import { finalPrice } from "@/lib/store";
import { Product } from "@/types/products";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function RusticProductCard({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) {
  const base = getProductBasePrice(product);
  const price = finalPrice(base, product.discountType, product.discountValue);
  const img = getFirstImageUrl(product);
  const slug = product.slug || product.id;

  const totalStock =
    product.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ??
    product.stock ??
    0;

  const isOut = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock < 10;

  const primaryVariant = product.variants?.[0];
  const unit = primaryVariant?.unit ?? product.unit ?? "ədəd";

  const isPremium = product.grade === "A" || product.statusTags?.includes("premium");
  const isOrganic = product.organic;
  const isVillage = product.originRegion?.toLowerCase().includes("gədəbəy");

  return (
    <motion.article
      whileHover={{
        scale: 1.035,
        y: -6,
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
      }}
      className="
        relative flex flex-col overflow-hidden
        rounded-4xl bg-white
        border border-neutral-200/40
        shadow-[0_6px_20px_rgba(0,0,0,0.06)]
        transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]
      "
    >
      {/* IMAGE — HIGH QUALITY + RESPONSIVE */}
      <Link href={`/products/${slug}`} className="relative w-full overflow-hidden rounded-t-4xl">
        <motion.div
          whileHover={{ scale: 1.07, rotate: 1.5 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
          className="relative w-full aspect-[4/5] md:aspect-[1/1.2] overflow-hidden rounded-t-4xl"
        >
          <Image
            src={img}
            alt={product.name}
            fill
            quality={100}
            className="object-cover rounded-t-4xl transition-transform duration-700 ease-in-out"
          />

          {/* SUBTLE DEPTH SHADOW */}
          <motion.div
            animate={{ scale: [1, 1.02, 1], opacity: [0.15, 0.4, 0.15] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/10 rounded-t-4xl pointer-events-none"
          />

          {/* MARKETING OVERLAY / BADGES */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-20">
            {isPremium && (
              <span className="px-3 py-1 text-[11px] rounded-full bg-amber-500 text-white font-bold shadow">
                ⭐ Premium seçim
              </span>
            )}
            {isOrganic && (
              <span className="px-3 py-1 text-[11px] rounded-full bg-green-600 text-white font-bold shadow">
                🌿 Orqanik & Təbii
              </span>
            )}
            {isVillage && (
              <span className="px-3 py-1 text-[11px] rounded-full bg-amber-700 text-white shadow">
                ⛰️ Gədəbəy Məhsulu
              </span>
            )}
            {isLowStock && (
              <span className="px-3 py-1 text-[11px] rounded-full bg-red-600 text-white font-bold shadow animate-pulse">
                ⚡ Son {totalStock} {unit} qaldı!
              </span>
            )}
          </div>

          {/* SUBTLE GRADIENT LAYER */}
          <motion.div
            animate={{ rotate: [0, 1.2, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-tr from-amber-50/10 via-green-50/10 to-white/0 rounded-t-4xl pointer-events-none"
          />
        </motion.div>
      </Link>

      {/* CONTENT */}
      <div className="p-3 md:p-4 flex flex-col gap-2 md:gap-3">
        <h3 className="text-sm md:text-[15px] font-bold text-[#1c2b1e] leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* PRICE */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[1.25rem] md:text-[1.35rem] font-extrabold text-emerald-700">
              {formatCurrency(price, currency)}
            </span>
            <span className="text-[10px] md:text-[11px] text-gray-600 ml-1 font-semibold">
              / {unit}
            </span>
            {base > price && (
              <p className="line-through text-gray-400 text-[10px] md:text-[11px] mt-0.5">
                {formatCurrency(base, currency)}
              </p>
            )}
          </div>

          {!isOut && (
            <span className="text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
              {isLowStock ? `Son ${totalStock} ${unit}` : `Stok: ${totalStock} ${unit}`}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
