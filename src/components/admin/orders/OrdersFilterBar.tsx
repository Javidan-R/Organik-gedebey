// src/components/admin/orders/OrdersFilterBar.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Clock,
  BarChart3,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { Select } from "@/components/atoms/select";
import { CheckboxInput } from "@/components/atoms/checkbox";
import Tooltip from "@/components/atoms/tooltip";
import { OrderStatus } from "@/types/orders";

export type OrdersFilterBarProps = {
  searchTerm: string;
  onSearch: (value: string) => void;

  filterStatus: OrderStatus | "all";
  onChangeStatus: (value: OrderStatus | "all") => void;

  dateStart: string;
  onChangeDateStart: (value: string) => void;

  dateEnd: string;
  onChangeDateEnd: (value: string) => void;

  onlyProblematic: boolean;
  onChangeProblematic: (value: boolean) => void;

  onResetFilters: () => void;
  isFilterActive: boolean;

  setToday: () => void;
  setLast7Days: () => void;
};

export const OrdersFilterBar: React.FC<OrdersFilterBarProps> = ({
  searchTerm,
  onSearch,
  filterStatus,
  onChangeStatus,
  dateStart,
  onChangeDateStart,
  dateEnd,
  onChangeDateEnd,
  onlyProblematic,
  onChangeProblematic,
  onResetFilters,
  isFilterActive,
  setToday,
  setLast7Days,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="
        w-full 
        rounded-2xl 
        px-5 py-4 
        bg-white/80 
        border 
        border-emerald-100 
        shadow-[0_4px_20px_rgba(0,0,0,0.06)]
        backdrop-blur-xl
        flex flex-col gap-4
      "
    >
      {/* GRID — fully responsive */}
      <div
        className="
          grid 
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-4
          xl:grid-cols-6
          gap-4
        "
      >
        {/* SEARCH */}
        <div className="col-span-1 xl:col-span-2">
          <Input
            type="search"
            label="Sifariş Axtar"
            placeholder="ID, müştəri adı, məhsul..."
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(val) => onSearch(String(val))}
          />
        </div>

        {/* DATE START */}
        <div>
          <Input
            type="date"
            label="Başlanğıc tarix"
            value={dateStart}
            onChange={(val) => onChangeDateStart(String(val))}
          />
        </div>

        {/* DATE END */}
        <div>
          <Input
            type="date"
            label="Son tarix"
            value={dateEnd}
            onChange={(val) => onChangeDateEnd(String(val))}
          />
        </div>

        {/* STATUS SELECT */}
        <div>
          <Select
            label="Status"
            name="filterStatus"
            value={filterStatus}
            onChange={(e) =>
              onChangeStatus(e.target.value as OrderStatus | "all")
            }
            options={[
              { value: "all", label: "Bütün statuslar" },
              { value: "pending", label: "Gözləyir" },
              { value: "shipping", label: "Yolda" },
              { value: "delivered", label: "Çatdırılıb" },
              { value: "cancelled", label: "Ləğv" },
            ]}
          />
        </div>

        {/* PROBLEMATIC (checkbox) */}
        <div className="flex items-center mt-2">
          <CheckboxInput
            label="Problemli sifarişlər"
            checked={onlyProblematic}
            onChange={(e) => onChangeProblematic(e.target.checked)}
          />
        </div>
      </div>

      {/* QUICK BUTTONS ROW */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Tooltip content="Bu günün sifarişləri">
          <Button
            variant="secondary"
            className="rounded-xl px-3 py-2 text-xs flex items-center gap-1"
            onClick={setToday}
          >
            <Clock className="w-3 h-3" />
            Bu gün
          </Button>
        </Tooltip>

        <Tooltip content="Son 7 gün">
          <Button
            variant="secondary"
            className="rounded-xl px-3 py-2 text-xs flex items-center gap-1"
            onClick={setLast7Days}
          >
            <BarChart3 className="w-3 h-3" />
            Son 7 gün
          </Button>
        </Tooltip>

        {isFilterActive && (
          <Tooltip content="Bütün filtrləri sıfırla">
            <Button
              variant="secondary"
              className="rounded-xl px-3 py-2 text-xs flex items-center gap-1 text-red-600"
              onClick={onResetFilters}
            >
              <Filter className="w-3 h-3" />
              Sıfırla
            </Button>
          </Tooltip>
        )}
      </div>
    </motion.div>
  );
};

export default OrdersFilterBar;
