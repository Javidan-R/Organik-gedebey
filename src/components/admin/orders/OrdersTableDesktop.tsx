// src/components/admin/orders/OrdersTableDesktop.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Clipboard,
  XCircle,
  MoreVertical,
} from "lucide-react";

import StatusBadge from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/atoms/button";
import Tooltip from "@/components/atoms/tooltip";
import { copyToClipboard } from "@/helpers";
import {
  OrderWithTotal,
  ColumnVisibility,
  SortKey,
  SortDirection,
  OrderStatus,
} from "@/types/orders";
import { ID } from "@/lib/store";
import RowCheckbox from "@/components/admin/molecules/RowCheckbox";

export type OrdersTableDesktopProps = {
  orders: OrderWithTotal[];
  columnVisibility: ColumnVisibility;

  selectedOrderIds: ID[];
  onRowCheckboxChange: (id: ID, checked: boolean) => void;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;

  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;

  onOpenDetails: (order: OrderWithTotal) => void;
  onStatusChange: (id: ID, status: OrderStatus) => void;

  getProductName: (item: any) => string; // gələcəkdə istifadə üçün
};

export const OrdersTableDesktop: React.FC<OrdersTableDesktopProps> = ({
  orders,
  columnVisibility,
  sortKey,
  sortDirection,
  onSort,
  selectedOrderIds,
  onRowCheckboxChange,
  allSelected,
  onSelectAll,
  onOpenDetails,
  onStatusChange,
  // getProductName // hazırda istifadə olunmur, amma props tipində var
}) => {
  const renderSortableHeader = (
    key: SortKey,
    label: string,
    isVisible: boolean,
  ) => {
    if (!isVisible) return null;
    const isActive = sortKey === key;
    const isAsc = sortDirection === "asc";

    return (
      <th
        className="px-[0.75rem] py-[0.75rem] cursor-pointer select-none text-left min-w-[7.5rem]"
        onClick={() => onSort(key)}
      >
        <span className="flex items-center gap-[0.25rem] font-extrabold text-[0.75rem] md:text-[0.85rem] text-slate-50">
          {label}
          <span>
            {isActive ? (
              isAsc ? (
                <ArrowUp className="w-[0.75rem] h-[0.75rem]" />
              ) : (
                <ArrowDown className="w-[0.75rem] h-[0.75rem]" />
              )
            ) : (
              <ChevronDown className="w-[0.75rem] h-[0.75rem] opacity-60" />
            )}
          </span>
        </span>
      </th>
    );
  };

  const visibleColumnCount =
    Object.values(columnVisibility).filter(Boolean).length + 1;

  return (
    <div className="hidden md:block overflow-x-auto rounded-[1.6rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-100/40">
      <table className="w-full text-[0.75rem] md:text-[0.85rem] border-collapse">
        <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-emerald-50 sticky top-0 z-10">
          <tr>
            <th className="px-[0.75rem] py-[0.75rem] w-[2.5rem] text-center">
              <RowCheckbox
                checked={allSelected && orders.length > 0}
                onChange={onSelectAll}
                className="mx-auto"
              />
            </th>
            {renderSortableHeader("createdAt", "ID", columnVisibility.id)}
            {renderSortableHeader(
              "createdAt",
              "Müştəri",
              columnVisibility.customer,
            )}
            {renderSortableHeader(
              "itemCount",
              "Məhsul sayı",
              columnVisibility.itemCount,
            )}
            {renderSortableHeader(
              "total",
              "Cəmi məbləğ",
              columnVisibility.total,
            )}
            {renderSortableHeader(
              "createdAt",
              "Status",
              columnVisibility.status,
            )}
            {renderSortableHeader(
              "createdAt",
              "Tarix",
              columnVisibility.date,
            )}
            {columnVisibility.actions && (
              <th className="px-[0.75rem] py-[0.75rem] text-left font-extrabold text-[0.75rem] md:text-[0.85rem]">
                Əməliyyat
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {orders.length > 0 ? (
              orders.map((o) => (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className={`border-t border-slate-100/80 hover:bg-emerald-50/60 transition-colors group cursor-pointer ${
                    selectedOrderIds.includes(o.id)
                      ? "bg-blue-50/60"
                      : "bg-white"
                  }`}
                  onDoubleClick={() => onOpenDetails(o)}
                >
                  <td className="px-[0.5rem] py-[0.5rem] text-center align-middle">
                    <RowCheckbox
                      checked={selectedOrderIds.includes(o.id)}
                      onChange={(v) => onRowCheckboxChange(o.id, v)}
                      className="mx-auto"
                    />
                  </td>

                  {columnVisibility.id && (
                    <td className="px-[0.75rem] py-[0.5rem] align-middle">
                      <div className="flex items-center gap-[0.3rem]">
                        <span className="font-mono text-[0.7rem] md:text-[0.75rem] text-slate-700">
                          {o.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Tooltip content="ID-ni kopyala">
                          <Button
                            variant="ghost"
                            className="p-0 h-[1.4rem] w-[1.4rem] opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(o.id)}
                          >
                            <Clipboard className="w-[0.8rem] h-[0.8rem] text-slate-500" />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  )}

                  {columnVisibility.customer && (
                    <td className="px-[0.75rem] py-[0.5rem] align-middle">
                      <Tooltip content="Müştəri haqqında əlavə məlumatı daha sonra genişləndirə bilərik">
                        <span className="font-semibold text-slate-900">
                          {o.customerName || "Anonim"}
                        </span>
                      </Tooltip>
                    </td>
                  )}

                  {columnVisibility.itemCount && (
                    <td className="px-[0.75rem] py-[0.5rem] text-center align-middle text-slate-700">
                      {o.itemCount}
                    </td>
                  )}

                  {columnVisibility.total && (
                    <td className="px-[0.75rem] py-[0.5rem] align-middle">
                      <span className="font-extrabold text-emerald-700 text-[0.9rem] md:text-[1rem]">
                        {o.total.toFixed(2)} ₼
                      </span>
                    </td>
                  )}

                  {columnVisibility.status && (
                    <td className="px-[0.75rem] py-[0.5rem] align-middle">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-[0.3rem]">
                        <StatusBadge status={o.status} />
                        <select
                          value={o.status}
                          onChange={(e) =>
                            onStatusChange(
                              o.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 text-[0.7rem] px-[0.4rem] py-[0.25rem] focus:outline-none focus:ring-[0.08rem] focus:ring-emerald-500 text-slate-700"
                        >
                          <option value="pending">Gözləyir</option>
                          <option value="shipping">Yolda</option>
                          <option value="delivered">Çatdırılıb</option>
                          <option value="cancelled">Ləğv</option>
                        </select>
                      </div>
                    </td>
                  )}

                  {columnVisibility.date && (
                    <td className="px-[0.75rem] py-[0.5rem] align-middle">
                      <div className="flex flex-col text-[0.7rem] text-slate-600">
                        <span className="font-semibold">
                          {new Date(o.createdAt).toLocaleDateString("az-AZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-mono text-[0.65rem] text-slate-400">
                          {new Date(o.createdAt).toLocaleTimeString("az-AZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  )}

                  {columnVisibility.actions && (
                    <td className="px-[0.75rem] py-[0.5rem] align-middle">
                      <Button
                        variant="soft"
                        className="opacity-80 group-hover:opacity-100 px-[0.7rem] py-[0.35rem] rounded-[0.8rem] text-[0.8rem]"
                        onClick={() => onOpenDetails(o)}
                      >
                        <MoreVertical className="w-[0.9rem] h-[0.9rem] mr-[0.25rem]" />
                        Detal
                      </Button>
                    </td>
                  )}
                </motion.tr>
              ))
            ) : (
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td
                  colSpan={visibleColumnCount}
                  className="text-center py-[2.5rem] text-slate-500"
                >
                  <XCircle className="inline-block w-[1.1rem] h-[1.1rem] mr-[0.35rem] text-red-400" />
                  Axtarışınıza uyğun sifariş tapılmadı.
                </td>
              </motion.tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTableDesktop;
