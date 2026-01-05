"use client";

import {
  clampNumber,
  safeFloatFromInput,
  formatPrice,
} from "@/app/admin/sales/new/page";
import { PaymentMethod, PosLine, SalesPaymentsProps } from "@/types/sales";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  CircleDollarSign,
  Minus,
  Plus,
  User,
  CreditCard,
  Wallet,
  Percent,
  Info,
  X,
  CheckCircle2,
  Loader2,
  Hash,
  Scale,
} from "lucide-react";
import React, { ChangeEvent } from "react";

const SalesPayments: React.FC<SalesPaymentsProps> = ({
  lines,
  subtotal,
  totalDue,
  balance,
  canCheckout,
  isSaving,

  paymentMethod,
  cashAmount,
  cardAmount,

  customerName,
  customerPhone,
  note,

  setPaymentMethod,
  setCashAmount,
  setCardAmount,
  setCustomerName,
  setCustomerPhone,
  setNote,

  handleLineAdjust,
  handleLineRemove,
  handleReset,
  handleCheckout,
}) => {
  // =============================================================
  // HANDLERS
  // =============================================================
  const handleCashChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = clampNumber(safeFloatFromInput(e.target.value), 0);
    setCashAmount(value);

    if (paymentMethod === "cash" && value < totalDue) setPaymentMethod("mixed");
    if (paymentMethod === "mixed" && value >= totalDue) {
      setPaymentMethod("cash");
      setCardAmount(0);
    }
  };

  const handleCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = clampNumber(safeFloatFromInput(e.target.value), 0);
    setCardAmount(value);

    if (paymentMethod === "card" && value < totalDue) setPaymentMethod("mixed");
    if (paymentMethod === "mixed" && value >= totalDue) {
      setPaymentMethod("card");
      setCashAmount(0);
    }
  };

  const setQuickPay = (method: PaymentMethod) => {
    if (method === "cash") {
      setCashAmount(totalDue);
      setCardAmount(0);
    } else if (method === "card") {
      setCardAmount(totalDue);
      setCashAmount(0);
    }
    setPaymentMethod(method);
  };

  // =============================================================
  // PREMIUM LINE ITEM CARD
  // =============================================================
  const LineItem: React.FC<{ line: PosLine }> = ({ line }) => {
    const isPiece = line.mode === "piece";
    const icon =
      line.mode === "piece" ? (
        <Hash className="w-3 h-3 text-emerald-600" />
      ) : (
        <Scale className="w-3 h-3 text-emerald-600" />
      );

    const handleQtyChange = (d: number) => {
      if (!isPiece) return;
      const newQty = clampNumber(line.qty + d, 1);
      handleLineAdjust(line.id, {
        qty: newQty,
        lineTotal: newQty * line.unitPrice,
      });
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 mb-3 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between">
          {/* TEXT PART */}
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-sm font-bold text-slate-900">
              {line.name}
              <span className="text-xs text-slate-500 ml-1">
                ({line.variantName})
              </span>
            </p>

            <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
              {icon}
              {line.qty.toFixed(isPiece ? 0 : 3).replace(".", ",")}{" "}
              {isPiece ? "ədəd" : "kq"} @ {formatPrice(line.unitPrice)}
              {line.note && (
                <Info className="w-3 h-3 text-blue-400 ml-1" />
              )}
            </p>
          </div>

          {/* ACTION & TOTAL */}
          <div className="flex flex-col items-end gap-2">
            {isPiece && (
              <div className="flex items-center rounded-full border border-slate-300 bg-slate-50 shadow-inner">
                <button
                  onClick={() => handleQtyChange(-1)}
                  disabled={line.qty <= 1}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 rounded-full"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-7 text-center font-bold text-sm">
                  {line.qty}
                </span>
                <button
                  onClick={() => handleQtyChange(1)}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-full"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="font-extrabold text-emerald-700 text-lg">
              {formatPrice(line.lineTotal)}
            </div>

            <button
              onClick={() => handleLineRemove(line.id)}
              className="p-1.5 rounded-full text-red-500 hover:bg-red-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // =============================================================
  // MAIN UI
  // =============================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-2xl space-y-8"
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCart className="w-7 h-7 text-emerald-600" />
        <h2 className="text-2xl font-extrabold text-slate-900">
          Səbət & Ödəniş
        </h2>
      </div>

      {/* CART LIST */}
      <div className="max-h-80 overflow-y-auto pr-2">
        <AnimatePresence>
          {lines.map((line) => (
            <LineItem key={line.id} line={line} />
          ))}
        </AnimatePresence>

        {!lines.length && (
          <div className="py-14 text-center text-slate-400 text-sm">
            Səbət hazırda boşdur — məhsul əlavə edin.
          </div>
        )}
      </div>

      {/* TOTALS */}
      <div className="space-y-3 rounded-xl p-4 bg-white border border-slate-200 shadow-inner">
        <div className="flex justify-between text-base text-slate-600">
          <span>Aracəmi:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-base text-red-500">
          <span>Endirim:</span>
          <span>0.00 ₼</span>
        </div>

        <div className="flex justify-between text-2xl font-extrabold text-slate-900 border-t pt-3 border-slate-300">
          <span>Yekun:</span>
          <span>{formatPrice(totalDue)}</span>
        </div>
      </div>

      {/* CUSTOMER INFO */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          Müştəri məlumatı (opsional)
        </h3>

        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Ad Soyad"
          className="w-full h-11 rounded-lg border px-3 text-sm border-slate-300 focus:border-blue-500 outline-none"
        />

        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Telefon"
          className="w-full h-11 rounded-lg border px-3 text-sm border-slate-300 focus:border-blue-500 outline-none"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Qeyd"
          rows={2}
          className="w-full rounded-lg border resize-none px-3 py-2 text-sm border-slate-300 focus:border-blue-500"
        />
      </div>

      {/* PAYMENT METHOD */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          Ödəniş metodu
        </h3>

        {/* PREMIUM SWITCH */}
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
          {(["cash", "card", "mixed"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setQuickPay(m)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-all shadow-sm
                ${
                  paymentMethod === m
                    ? "bg-white text-emerald-700 shadow-md"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
            >
              {m === "cash" && <Wallet className="w-4 h-4 inline mr-1" />}
              {m === "card" && <CreditCard className="w-4 h-4 inline mr-1" />}
              {m === "mixed" && <Percent className="w-4 h-4 inline mr-1" />}
              {m === "cash"
                ? "Nağd"
                : m === "card"
                ? "Kart"
                : "Qarışıq"}
            </button>
          ))}
        </div>

        {/* CASH */}
        {(paymentMethod === "cash" || paymentMethod === "mixed") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <label className="text-xs font-semibold text-slate-600">
              Nağd məbləğ
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={handleCashChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-300 font-semibold focus:border-emerald-500"
            />
          </motion.div>
        )}

        {/* CARD */}
        {(paymentMethod === "card" || paymentMethod === "mixed") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <label className="text-xs font-semibold text-slate-600">
              Kart məbləği
            </label>
            <input
              type="number"
              value={cardAmount}
              onChange={handleCardChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-300 font-semibold focus:border-blue-500"
            />
          </motion.div>
        )}
      </div>

      {/* BALANCE */}
      <div className="border-t pt-4 border-slate-200">
        <div
          className={`rounded-2xl p-5 shadow-lg flex justify-between text-xl font-bold
            ${
              balance >= 0
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "bg-red-100 text-red-900 border border-red-300"
            }`}
        >
          <span>{balance >= 0 ? "Qalıq:" : "Çatışmayan:"}</span>
          <span className="text-3xl font-extrabold">
            {formatPrice(Math.abs(balance))}
          </span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handleCheckout}
          disabled={!canCheckout || isSaving || !lines.length}
          className="h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center gap-3 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 transition shadow-xl"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
          {isSaving ? "Yadda Saxlanılır..." : "Satışı Tamamla"}
        </button>

        <button
          onClick={handleReset}
          className="h-11 rounded-xl border border-slate-300 bg-white text-base text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 transition"
        >
          <Trash2 className="w-5 h-5" /> Satışı Sıfırla
        </button>
      </div>
    </motion.div>
  );
};

export default SalesPayments;
