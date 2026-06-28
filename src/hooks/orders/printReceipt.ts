// src/utils/orders/printReceipt.ts
"use client";

import type { OrderWithTotal } from "@/types/orders";

export function printOrderReceipt(order: OrderWithTotal) {
  if (typeof window === "undefined") return;

  const win = window.open("", "_blank", "width=480,height=640");
  if (!win) return;

  const itemsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:2px 0;">${i.productName ?? i.productId ?? "Məhsul"}</td>
        <td style="padding:2px 0; text-align:center;">${i.qty}</td>
        <td style="padding:2px 0; text-align:right;">${Number(i.priceAtOrder).toFixed(2)}</td>
        <td style="padding:2px 0; text-align:right;">${(
          i.qty * Number(i.priceAtOrder)
        ).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Çek #${order.id}</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; padding: 12px; }
          h1 { font-size: 16px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border-bottom: 1px dashed #ddd; padding: 2px 0; }
          th { text-align: left; }
          .totals { margin-top: 8px; text-align: right; font-weight: bold; }
          .meta { font-size: 11px; color: #555; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <h1>Organik Gədəbəy</h1>
        <div class="meta">
          Çek ID: #${order.id.slice(0, 8).toUpperCase()}<br/>
          Tarix: ${new Date(order.createdAt).toLocaleString("az-AZ")}<br/>
          Müştəri: ${order.customerName ?? "Anonim"}
        </div>
        <table>
          <thead>
            <tr>
              <th>Məhsul</th>
              <th style="text-align:center;">Say</th>
              <th style="text-align:right;">Qiymət</th>
              <th style="text-align:right;">Cəmi</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          Yekun məbləğ: ${Number(order.total).toFixed(2)} ₼
        </div>
        <p style="margin-top:10px;text-align:center;">Təşəkkürlər! Yenidən gözləyirik 🌿</p>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 200);
          };
        </script>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
