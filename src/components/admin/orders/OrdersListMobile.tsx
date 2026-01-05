// src/components/admin/orders/OrdersListMobile.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, MoreVertical } from "lucide-react";

import StatusBadge from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/atoms/button";
import { OrderWithTotal, OrderStatus } from "@/types/orders";
import { ID } from "@/lib/store";
import RowCheckbox from "@/components/admin/molecules/RowCheckbox";

type Props = {
  orders: OrderWithTotal[];
  selectedOrderIds: ID[];
  onRowCheckboxChange: (id: ID, checked: boolean) => void;
  onStatusChange: (id: ID, status: OrderStatus) => void;
  onOpenDetails: (order: OrderWithTotal) => void;
};

export const OrdersListMobile: React.FC<Props> = ({
  orders,
  selectedOrderIds,
  onRowCheckboxChange,
  onStatusChange,
  onOpenDetails,
}) => {
  return (
    <div className="md:hidden space-y-[0.75rem]">
      <AnimatePresence>
        {orders.length > 0 ? (
          orders.map((o) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-[1.2rem] border border-emerald-100 bg-white shadow-md shadow-emerald-50 p-4 flex flex-col gap-[0.4rem] ${
                selectedOrderIds.includes(o.id) ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-[0.5rem]">
                <div className="flex-1">
                  <p className="font-mono text-[0.7rem] text-slate-500">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-[0.25rem] font-semibold text-slate-900 text-[0.95rem]">
                    {o.customerName || "Anonim Müştəri"}
                  </p>
                </div>
                <RowCheckbox
                  checked={selectedOrderIds.includes(o.id)}
                  onChange={(v) => onRowCheckboxChange(o.id, v)}
                />
              </div>

              <div className="flex items-center justify-between text-[0.8rem] text-slate-600">
                <span>
                  Məhsul sayı:{" "}
                  <strong className="text-slate-900">{o.itemCount}</strong>
                </span>
                <span>
                  Cəmi:{" "}
                  <strong className="text-emerald-700">
                    {o.total.toFixed(2)} ₼
                  </strong>
                </span>
              </div>

              <div className="flex items-center justify-between mt-[0.35rem]">
                <StatusBadge status={o.status} />
                <p className="text-[0.7rem] text-slate-500 text-right">
                  {new Date(o.createdAt).toLocaleDateString("az-AZ", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {new Date(o.createdAt).toLocaleTimeString("az-AZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="mt-[0.5rem] flex items-center justify-between gap-[0.5rem]">
                <select
                  value={o.status}
                  onChange={(e) =>
                    onStatusChange(o.id, e.target.value as OrderStatus)
                  }
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 text-[0.75rem] px-[0.5rem] py-[0.25rem] focus:outline-none focus:ring-[0.08rem] focus:ring-emerald-500 text-slate-700"
                >
                  <option value="pending">Gözləyir</option>
                  <option value="shipping">Yolda</option>
                  <option value="delivered">Çatdırılıb</option>
                  <option value="cancelled">Ləğv</option>
                </select>
                <Button
                  variant="primary"
                  className="px-[0.8rem] py-[0.45rem] rounded-[0.9rem] text-[0.8rem]"
                  onClick={() => onOpenDetails(o)}
                >
                  <MoreVertical className="w-[0.9rem] h-[0.9rem] mr-[0.25rem]" />
                  Detal
                </Button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-[2.5rem] text-slate-500 rounded-[1.2rem] border border-dashed border-slate-200 bg-white/70">
            <XCircle className="inline-block w-[1.1rem] h-[1.1rem] mr-[0.35rem] text-red-400" />
            Axtarışınıza uyğun sifariş tapılmadı.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersListMobile;
