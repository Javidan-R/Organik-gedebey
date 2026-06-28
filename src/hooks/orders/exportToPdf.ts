// src/utils/orders/exportToPdf.ts
"use client";

import jsPDF from "jspdf";
import type { OrderWithTotal } from "@/types/orders";

export function exportOrdersToPdf(orders: OrderWithTotal[]) {
  if (!orders.length) return;

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const title = "Sifarişlər Hesabatı";
  doc.setFontSize(16);
  doc.text(title, 10, 15);

  doc.setFontSize(10);
  doc.text(
    `Tarix: ${new Date().toLocaleString("az-AZ")}`,
    10,
    22
  );

  let y = 30;
  const lineHeight = 6;

  orders.forEach((o, idx) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }

    doc.setFont(undefined, "bold");
    doc.text(`#${o.id.slice(0, 8).toUpperCase()}`, 10, y);
    doc.setFont(undefined, "normal");
    doc.text(`Müştəri: ${o.customerName ?? "Anonim"}`, 40, y);
    doc.text(
      `Məbləğ: ${o.total.toFixed(2)} ₼  | Status: ${o.status}`,
      10,
      y + 5
    );
    doc.text(
      `Tarix: ${new Date(o.createdAt).toLocaleString("az-AZ")}`,
      10,
      y + 10
    );

    y += 16;

    if (idx < orders.length - 1) {
      doc.setDrawColor(200);
      doc.line(10, y, 200, y);
      y += 4;
    }
  });

  doc.save(`orders_${new Date().toISOString()}.pdf`);
}
