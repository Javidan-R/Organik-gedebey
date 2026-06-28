// src/utils/orders/exportToExcel.ts
"use client";

import * as XLSX from "xlsx";
import type { OrderWithTotal } from "@/types/orders";

export function exportOrdersToExcel(orders: OrderWithTotal[]) {
  if (!orders.length) return;

  const rows = orders.map((o) => ({
    ID: o.id,
    Müştəri: o.customerName ?? "Anonim",
    Status: o.status,
    "Məhsul sayı": (o as any).itemCount ?? o.items.length,
    "Cəmi məbləğ": o.total.toFixed(2),
    "Yaradılma tarixi": new Date(o.createdAt).toLocaleString("az-AZ"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  XLSX.writeFile(workbook, `orders_${new Date().toISOString()}.xlsx`);
}
