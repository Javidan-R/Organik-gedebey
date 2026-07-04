import { Product } from "@/lib/store";
import { formatCurrency } from "@/utils/product";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, CheckCircle2, ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";

type QuickViewProps = {
  open: boolean;
  onClose: () => void;
  product: Product; 
  imgUrl: string;
  discount: number;
  displayPrice: number;
  basePrice: number;
  currency: string;
  qty: number;
  isOut: boolean;
  addingToCart: boolean;
  addedToCart: boolean;
  selectedVariantIdx: number;
  setSelectedVariantIdx: (i: number) => void;
  handleQtyChange: (delta: number) => void;
  handleAddToCart: () => void;
};

export const QuickViewModal: React.FC<QuickViewProps> = ({
  open,
  onClose,
  product,
  imgUrl,
  discount,
  displayPrice,
  basePrice,
  currency,
  qty,
  isOut,
  addingToCart,
  addedToCart,
  selectedVariantIdx,
  setSelectedVariantIdx,
  handleQtyChange,
  handleAddToCart,
}) => {
  if (!product) return null;

  /* ============================= */
  /* 🔒 BODY SCROLL LOCK + ESC KEY */
  /* ============================= */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ============================= */}
          {/* 🔳 OVERLAY */}
          {/* ============================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          />

          {/* ============================= */}
          {/* 🧊 MODAL */}
          {/* ============================= */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 60 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onClick={(e) => e.stopPropagation()} // 🔥 overlay bug fix
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[201] max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* ============================= */}
            {/* 🖼 HEADER IMAGE */}
            {/* ============================= */}
            <div className="relative h-56 bg-slate-50 shrink-0">
              <Image
                src={imgUrl}
                alt={product.name}
                fill
                className="object-contain p-4"
              />

              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
                  -{discount}%
                </div>
              )}

              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-105 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ============================= */}
            {/* 📦 CONTENT */}
            {/* ============================= */}
            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Title + Region */}
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {product.name}
                </h3>

                {product.originRegion && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {product.originRegion}
                  </p>
                )}
              </div>
              {/* Description */}
              {product.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* ============================= */}
              {/* 🧩 VARIANTS (IMPROVED) */}
              {/* ============================= */}
              {(product.variants?.length ?? 0) > 1 && (
  <div className="space-y-2">
    
    {/* Label */}
    <p className="text-xs font-semibold text-slate-700">
      Variant seç:
    </p>

    {/* Variants */}
    <div className="flex gap-2 flex-wrap">
      {product.variants!.map((v, i) => {
        const label =
          v.label ??
          v.name ??
          (v.weight ? `${v.weight}${v.unit ?? ""}` : "Variant");

        return (
          <motion.button
            key={v.id || i}
            whileTap={{ scale: 0.94 }}
            onClick={() => setSelectedVariantIdx(i)}
            className={`
              relative px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              flex items-center gap-1 max-w-[120px]

              ${
                i === selectedVariantIdx
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800 shadow-sm"
                  : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
              }
            `}
          >
            {/* Selected indicator */}
            {i === selectedVariantIdx && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            )}

            {/* Label */}
            <span className="truncate">
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>

    {/* Overflow info */}
    {product.variants!.length > 6 && (
      <span className="text-[10px] text-slate-400">
        +{product.variants!.length - 6} daha variant
      </span>
    )}
  </div>
)}

              {/* ============================= */}
              {/* 💰 PRICE + ACTION */}
              {/* ============================= */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(displayPrice, currency)}
                  </span>

                  {discount > 0 && (
                    <span className="text-xs line-through text-slate-400 ml-2">
                      {formatCurrency(basePrice, currency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  
                  {/* Qty */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-full px-1 py-1">
                    <button
                      onClick={() => handleQtyChange(-1)}
                      className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold"
                    >
                      −
                    </button>

                    <span className="min-w-[1.5rem] text-center text-sm font-bold">
                      {qty}
                    </span>

                    <button
                      onClick={() => handleQtyChange(1)}
                      className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to cart */}
                  {!isOut && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center gap-2 disabled:opacity-60"
                    >
                      {addingToCart ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : addedToCart ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Əlavə edildi!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Səbətə at
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};