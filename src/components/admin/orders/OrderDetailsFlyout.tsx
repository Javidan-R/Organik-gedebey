// src/components/admin/orders/OrderDetailsFlyout.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Phone,
  MapPin,
  ShoppingCart,
  CreditCard,
  Wallet,
  Percent,
  Info,
  Package,
} from "lucide-react";
import type { OrderWithTotal } from "@/types/orders";
import StatusBadge from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/atoms/button";

type Props = {
  order: (OrderWithTotal & {
    paymentMethod?: "cash" | "card" | "mixed";
    cashAmount?: number;
    cardAmount?: number;
    note?: string;
    address?: string;
    customerPhone?: string;
  }) | null;
  onClose: () => void;
  getProductName: (item: any) => string;
};

const labelClass =
  "text-[0.7rem] uppercase tracking-wide text-slate-500 font-semibold";
const valueClass = "text-[0.85rem] font-semibold text-slate-900";

export const OrderDetailsFlyout: React.FC<Props> = ({
  order,
  onClose,
  getProductName,
}) => {
  if (!order) return null;

  const {
    id,
    createdAt,
    customerName,
    customerPhone,
    address,
    items,
    total,
    status,
    paymentMethod,
    cashAmount,
    cardAmount,
    note,
  } = order as any;

  const createdDate = new Date(createdAt);

  const renderPaymentTag = () => {
    if (!paymentMethod) return <span className={valueClass}>—</span>;

    if (paymentMethod === "cash") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[0.75rem] font-semibold">
          <Wallet className="w-3 h-3" />
          Nağd
        </span>
      );
    }
    if (paymentMethod === "card") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[0.75rem] font-semibold">
          <CreditCard className="w-3 h-3" />
          Kart
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[0.75rem] font-semibold">
        <Percent className="w-3 h-3" />
        Qarışıq
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[0.7rem] text-slate-500">Sifariş ID</p>
            <p className="font-mono text-sm font-bold text-slate-900">
              #{id.slice(0, 10).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <Button
              variant="ghost"
              className="p-1 rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Müştəri bloku */}
          <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-7 h-7 rounded-full bg-emerald-600 text-white items-center justify-center">
                <User className="w-4 h-4" />
              </span>
              <div>
                <p className={labelClass}>Müştəri</p>
                <p className="font-semibold text-sm text-slate-900">
                  {customerName ?? "Anonim müştəri"}
                </p>
              </div>
            </div>

            {customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <p className={valueClass}>{customerPhone}</p>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-[2px]" />
                <p className={valueClass}>{address}</p>
              </div>
            )}
          </section>

          {/* Tarix & status məlumatı */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-3">
              <p className={labelClass}>Yaradılma</p>
              <p className={valueClass}>
                {createdDate.toLocaleDateString("az-AZ", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-[0.7rem] text-slate-500">
                {createdDate.toLocaleTimeString("az-AZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-3">
              <p className={labelClass}>Ümumi məbləğ</p>
              <p className="text-lg font-extrabold text-emerald-700">
                {total.toFixed(2)} ₼
              </p>
            </div>
          </section>

          {/* Payment bloku */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={labelClass}>Ödəniş növü</p>
                {renderPaymentTag()}
              </div>
            </div>

            {(cashAmount != null || cardAmount != null) && (
              <div className="grid grid-cols-2 gap-3 text-[0.8rem]">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5">
                  <p className="text-[0.7rem] text-emerald-700 flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    Nağd
                  </p>
                  <p className="font-bold text-emerald-800 mt-1">
                    {cashAmount != null ? `${cashAmount.toFixed(2)} ₼` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5">
                  <p className="text-[0.7rem] text-blue-700 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Kart
                  </p>
                  <p className="font-bold text-blue-800 mt-1">
                    {cardAmount != null ? `${cardAmount.toFixed(2)} ₼` : "—"}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Məhsulların siyahısı */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-600" />
                <p className={labelClass}>Məhsullar</p>
              </div>
              <span className="text-[0.75rem] text-slate-500">
                {(order as any).itemCount ?? items.length} məhsul
              </span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {items.map((item: any, idx: number) => {
                const lineTotal = item.qty * item.priceAtOrder;
                return (
                  <div
                    key={`${item.productId ?? idx}-${idx}`}
                    className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8rem] font-semibold text-slate-900 line-clamp-2">
                        {getProductName(item)}
                      </p>
                      <p className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {item.qty} × {item.priceAtOrder.toFixed(2)} ₼
                      </p>
                      {item.note && (
                        <p className="text-[0.7rem] text-amber-700 mt-0.5 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {item.note}
                        </p>
                      )}
                    </div>
                    <p className="text-[0.8rem] font-extrabold text-emerald-700">
                      {lineTotal.toFixed(2)} ₼
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Qeyd / daxili info */}
          {(note || status === "cancelled") && (
            <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <p className="text-[0.8rem] font-semibold text-amber-800">
                  Qeyd / əlavə məlumat
                </p>
              </div>
              {note && (
                <p className="text-[0.8rem] text-amber-900 whitespace-pre-line">
                  {note}
                </p>
              )}
              {status === "cancelled" && !note && (
                <p className="text-[0.8rem] text-amber-900">
                  Bu sifariş ləğv edilib.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Footer buttons (istəsən burdan export/print də çağırarsan) */}
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-2 bg-slate-50/60">
          <Button
            variant="secondary"
            className="text-[0.8rem]"
            onClick={onClose}
          >
            Bağla
          </Button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
