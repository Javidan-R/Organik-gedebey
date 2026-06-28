"use client";

import {
  clampNumber,
  formatPrice,
  safeFloatFromInput,
  WEIGHT_PRESETS,
} from "@/app/admin/sales/new/page";
import { variantFinalPrice } from "@/lib/calc";
import { useApp, cryptoIdSafe } from "@/lib/store";

import { motion } from "framer-motion";
import {
  CircleDollarSign,
  Scale,
  Plus,
  Hash,
  Tag,
  Sparkles,
} from "lucide-react";

import React, { useCallback, useMemo, useState } from "react";

// ⬇️ Input + Button komponentlərini əlavə edirik
import { Input } from "@/components/atoms/input"; 
import { Button } from "@/components/atoms/button";
import { LineMode, PosLine, SalesConfigProps } from "@/types/sales";



const SalesConfig: React.FC<SalesConfigProps> = ({
  onLineAdd,
  selectedProductId,
  selectedVariantId,
}) => {
  const { products, categories } = useApp();

  // -----------------------------------------
  // SELECTED PRODUCT + VARIANT
  // -----------------------------------------
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const selectedVariant = useMemo(
    () =>
      selectedProduct?.variants.find((v) => v.id === selectedVariantId) ??
      selectedProduct?.variants[0],
    [selectedProduct, selectedVariantId]
  );

  const unitPrice = useMemo(() => {
    if (!selectedProduct || !selectedVariant) return 0;
    return variantFinalPrice(selectedProduct, selectedVariant);
  }, [selectedProduct, selectedVariant]);

  const categoryName =
    categories.find((c) => c.id === selectedProduct?.categoryId)?.name ||
    "Kateqoriya";

  // -----------------------------------------
  // STATES
  // -----------------------------------------
  const [mode, setMode] = useState<LineMode>("piece");
  const [qty, setQty] = useState(1);
  const [kg, setKg] = useState(1);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  // -----------------------------------------
  // CALCULATIONS
  // -----------------------------------------
  const qtyByAmount = useMemo(() => {
    if (mode !== "amount" || unitPrice <= 0) return 0;
    return amount / unitPrice;
  }, [mode, amount, unitPrice]);

  const lineTotal = useMemo(() => {
    if (!selectedProduct) return 0;

    if (mode === "piece") return qty * unitPrice;
    if (mode === "weight") return kg * unitPrice;
    if (mode === "amount") return clampNumber(amount);

    return 0;
  }, [selectedProduct, qty, kg, amount, unitPrice, mode]);

  // -----------------------------------------
  // ADD LINE
  // -----------------------------------------
  const addLine = useCallback(() => {
    if (!selectedProduct || !selectedVariant || lineTotal <= 0) return;

    let finalQty = qty;

    if (mode === "weight") finalQty = kg;
    if (mode === "amount") finalQty = qtyByAmount;

    const line: PosLine = {
      id: cryptoIdSafe(),
      productId: selectedProduct.id,
      variantId: selectedVariant.id,
      name: selectedProduct.name,
      variantName: selectedVariant.name,
      unitPrice: unitPrice,
      mode,
      qty: finalQty,
      lineTotal,
      note: note.trim() || undefined,
    };

    onLineAdd(line);

    // Reset
    setQty(1);
    setKg(1);
    setAmount(0);
    setNote("");
    setMode("piece");
  }, [selectedProduct, selectedVariant, unitPrice, mode, qty, kg, qtyByAmount, lineTotal, onLineAdd, note]);

  // -----------------------------------------
  // EMPTY STATE
  // -----------------------------------------
  if (!selectedProduct) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl min-h-100 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 inline text-blue-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">
            Məhsul Konfiqurasiyası
          </h2>
          <p className="text-base text-slate-500 max-w-xs">
            Zəhmət olmasa, yuxarıdan bir məhsul seçin.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, y: "1rem" }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
    >
      <h2 className="text-xl font-extrabold text-slate-800 mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        Məhsul Konfiqurasiyası
      </h2>

      {/* SELECTED PRODUCT */}
      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-inner">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
              <Tag className="w-4 h-4" /> {categoryName}
            </p>

            <h3 className="font-bold text-lg text-slate-900 line-clamp-2">
              {selectedProduct.name}
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm text-slate-600">{selectedVariant?.name}</p>
            <p className="text-2xl font-extrabold text-emerald-800">
              {formatPrice(unitPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* MODE SWITCH */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          Satış rejimi
        </label>

        <div className="flex rounded-xl bg-slate-100 p-1 shadow-inner">
          <Button
            variant={mode === "piece" ? "success" : "soft"}
            className="flex-1"
            onClick={() => setMode("piece")}
          >
            <Hash className="w-4 h-4" /> Ədəd
          </Button>

          <Button
            variant={mode === "weight" ? "success" : "soft"}
            className="flex-1"
            onClick={() => setMode("weight")}
          >
            <Scale className="w-4 h-4" /> Kiloqram
          </Button>

          <Button
            variant={mode === "amount" ? "success" : "soft"}
            className="flex-1"
            onClick={() => setMode("amount")}
          >
            <CircleDollarSign className="w-4 h-4" /> Məbləğ
          </Button>
        </div>
      </div>

      {/* INPUT BLOCK */}
      <div className="mb-5 rounded-xl border border-slate-300 p-4 space-y-5">

        {/* PIECE MODE */}
        {mode === "piece" && (
          <Input
            label="Ədəd sayı"
            type="number"
            value={qty}
            min={1}
            onChange={(value) =>
              setQty(clampNumber(safeFloatFromInput(value), 1))
            }
            className="text-2xl font-bold text-center"
          />
        )}

        {/* WEIGHT MODE */}
        {mode === "weight" && (
          <>
            <Input
              label="Çəki (kq)"
              type="number"
              value={kg}
              min={0.01}
              step={0.01}
              onChange={(value) =>
                setKg(clampNumber(safeFloatFromInput(value), 0.01))
              }
              className="text-2xl font-bold text-center"
            />

            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {WEIGHT_PRESETS.map((val) => (
                <Button
                  key={val}
                  variant="soft"
                  className="px-4 py-2 rounded-full"
                  onClick={() => setKg(val)}
                >
                  {val} kq
                </Button>
              ))}
            </div>
          </>
        )}

        {/* AMOUNT MODE */}
        {mode === "amount" && (
          <>
            <Input
              label="Müştərinin ödədiyi məbləğ (AZN)"
              type="number"
              value={amount}
              min={0.01}
              step={0.01}
              onChange={(value) =>
                setAmount(clampNumber(safeFloatFromInput(value), 0.01))
              }
              className="text-2xl font-bold text-center"
            />

            <p className="text-center text-sm text-slate-600">
              Uyğun miqdar:
              <span className="font-bold text-emerald-700 ml-1">
                {qtyByAmount.toFixed(3)} {mode === "weight" ? "kq" : "ədəd"}
              </span>
            </p>
          </>
        )}

        {/* NOTE */}
        <Input
          label="Qeyd (opsional)"
          value={note}
          placeholder="Xüsusi təlimat"
          onChange={(value) => setNote(value)}
        />
      </div>

      {/* TOTAL */}
      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between mb-4 bg-blue-100 p-3 rounded-xl shadow-sm">
          <span className="font-bold text-blue-800">Sətrin yekunu:</span>
          <span className="text-3xl font-extrabold text-blue-900">
            {formatPrice(lineTotal)}
          </span>
        </div>

        {/* ADD BUTTON */}
        <Button
          variant="success"
          className="w-full h-14 text-lg font-bold shadow-lg"
          onClick={addLine}
          disabled={!selectedProduct || lineTotal <= 0}
        >
          <Plus className="w-5 h-5" />
          Səbətə əlavə et
        </Button>
      </div>
    </motion.div>
  );
};

export default SalesConfig;
