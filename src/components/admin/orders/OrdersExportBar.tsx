// src/components/admin/orders/OrdersExportBar.tsx
"use client";

import React from "react";
import { FileText, Printer, FileSpreadsheet } from "lucide-react";
import type { OrderWithTotal } from "@/types/orders";
import { ID } from "@/lib/store";
import { Button } from "@/components/atoms/button";
import Tooltip from "@/components/atoms/tooltip";
import { exportOrdersToExcel } from "@/hooks/orders/exportToExcel";
import { exportOrdersToPdf } from "@/hooks/orders/exportToPdf";
import { printOrderReceipt } from "@/hooks/orders/printReceipt";

type Props = {
  orders: OrderWithTotal[];
  selectedOrderIds: ID[];
};

export const OrdersExportBar: React.FC<Props> = ({
  orders,
  selectedOrderIds,
}) => {
  const selectedOrders = selectedOrderIds.length
    ? orders.filter((o) => selectedOrderIds.includes(o.id))
    : orders;

  const disabled = !selectedOrders.length;

  const handleExcel = () => {
    if (!selectedOrders.length) return;
    exportOrdersToExcel(selectedOrders);
  };

  const handlePdf = () => {
    if (!selectedOrders.length) return;
    exportOrdersToPdf(selectedOrders);
  };

  const handlePrintFirst = () => {
    if (!selectedOrders.length) return;
    printOrderReceipt(selectedOrders[0]);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-emerald-100 rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-xs sm:text-sm text-slate-600">
        {selectedOrderIds.length > 0 ? (
          <>
            Seçilmiş{" "}
            <span className="font-bold text-emerald-700">
              {selectedOrderIds.length}
            </span>{" "}
            sifariş üçün export / çap:
          </>
        ) : (
          <>
            Filtrə uyğun{" "}
            <span className="font-bold text-emerald-700">
              {orders.length}
            </span>{" "}
            sifarişi export / çap et.
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Tooltip content="Excel (xlsx) olaraq yüklə">
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={handleExcel}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
        </Tooltip>

        <Tooltip content="PDF hesabatı çıxar">
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={handlePdf}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        </Tooltip>

        <Tooltip content="Seçilmiş ilk sifariş üçün çek çap et">
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={handlePrintFirst}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4" />
            Çek
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
