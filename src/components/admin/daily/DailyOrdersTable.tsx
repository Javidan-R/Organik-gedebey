// src/components/admin/daily/DailyOrdersTable.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, User, CreditCard, Banknote, Package,
} from 'lucide-react';
import { currency } from '@/helpers';
import type { DailyOrder } from '@/hooks/useDailySummary';

interface Props {
  orders?: DailyOrder[];
}

export default function DailyOrdersTable({ orders = [] }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = orders.filter(
    (o) =>
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
        Bu gün heç bir sifariş yoxdur.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Bugünkü Sifarişlər ({filtered.length})
        </h3>
        <input
          type="text"
          placeholder="Axtarış (ad, nömrə)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-48 rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Sifariş №</th>
              <th className="px-4 py-3 text-left">Müştəri</th>
              <th className="px-4 py-3 text-right">Məbləğ</th>
              <th className="px-4 py-3 text-center">Ödəniş</th>
              <th className="px-4 py-3 text-right">Saat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-xs font-semibold text-slate-700">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-800">{order.customerName}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-semibold text-emerald-700">
                  {Number(order.total).toFixed(2)} ₼
                </td>
                <td className="px-4 py-2 text-center">
                  {order.paymentMethod === 'CARD' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <CreditCard className="w-3 h-3" /> Kart
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <Banknote className="w-3 h-3" /> Nağd
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleTimeString('az-AZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => toggle(order.id)}
                    className="p-1 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedIds.has(order.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.map((order) => (
          <AnimatePresence key={order.id}>
            {expandedIds.has(order.id) && (
              <motion.tr
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50/50"
              >
                <td colSpan={6} className="px-4 py-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Məhsullar:
                    </p>
                    <div className="grid gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 text-xs"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.qty} × {Number(item.priceAtOrder).toFixed(2)} ₼
                            </p>
                          </div>
                          <p className="font-semibold text-emerald-700">
                            {(item.qty * Number(item.priceAtOrder)).toFixed(2)} ₼
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                      <span className="font-semibold text-slate-600">Ümumi:</span>
                      <span className="font-bold text-emerald-700">
                        {Number(order.total).toFixed(2)} ₼
                      </span>
                    </div>
                  </div>
                </td>
              </motion.tr>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
}