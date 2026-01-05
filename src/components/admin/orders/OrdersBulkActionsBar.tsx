// src/components/admin/orders/OrdersBulkActionsBar.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Select } from "@/components/atoms/select";
import { OrderStatus } from "@/types/orders";

export type OrdersBulkActionsBarProps = {
  selectedCount: number;
  bulkUpdateStatus: OrderStatus | "all";
  onBulkStatusChange: (value: OrderStatus | "all") => void;
  onApply: () => void;
};

export const OrdersBulkActionsBar: React.FC<OrdersBulkActionsBarProps> = ({
  selectedCount,
  bulkUpdateStatus,
  onBulkStatusChange,
  onApply,
}) => {
  if (!selectedCount) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/70 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-[0.75rem] text-[0.75rem] md:text-[0.85rem] shadow-sm"
    >
      <span className="text-blue-900 font-medium flex items-center gap-[0.4rem]">
        <span className="inline-flex items-center justify-center w-[1.6rem] h-[1.6rem] rounded-full bg-blue-500 text-white shadow">
          <Package className="w-[0.9rem] h-[0.9rem]" />
        </span>
        <span>
          <strong>{selectedCount}</strong> sifariş seçilib
        </span>
      </span>

      <div className="flex items-center gap-[0.75rem]">
        <Select
          name="bulkStatus"
          value={bulkUpdateStatus}
          onChange={(e) =>
            onBulkStatusChange(e.target.value as OrderStatus | "all")
          }
          options={[
            { value: "all", label: "Status seç" },
            { value: "pending", label: "Gözləyir" },
            { value: "shipping", label: "Yolda" },
            { value: "delivered", label: "Çatdırılıb" },
            { value: "cancelled", label: "Ləğv et" },
          ]}
          className="w-[11rem]"
        />
        <Button
          variant="primary"
          className="text-[0.8rem] px-[0.9rem] py-[0.4rem] rounded-[0.9rem]"
          onClick={onApply}
          disabled={bulkUpdateStatus === "all"}
        >
          Tətbiq et
        </Button>
      </div>
    </motion.div>
  );
};

export default OrdersBulkActionsBar;
