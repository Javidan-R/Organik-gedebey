// src/components/admin/baskets/BasketCard.tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Edit, Archive, Trash2
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Basket } from '@/types/basket';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/utils/product';
import Image from 'next/image';

interface BasketCardProps {
  basket: Basket;
  onEdit: (basket: Basket) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode: 'grid' | 'list';
}

function calculateBasketMetrics(basket: Basket, products: any[]) {
  const primaryVariant = basket.variants?.[0];
  const price = primaryVariant ? parseFloat(primaryVariant.price) : 0;
  let totalCost = 0;
  let totalRevenue = 0;
  if (basket.products && basket.products.length > 0) {
    for (const bp of basket.products) {
      const product = products.find(p => p.id === bp.productId);
      if (product) {
        const variant = product.variants?.find((v: { id: string | undefined; }) => v.id === bp.productVariantId) || product.variants?.[0];
        const cost = variant?.costPrice ?? 0;
        const qty = parseFloat(bp.quantity) || 1;
        totalCost += cost * qty;
        totalRevenue += (variant?.price ?? 0) * qty;
      }
    }
  } else {
    totalCost = price * 0.6;
    totalRevenue = price;
  }
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  return { price, totalCost, totalRevenue, profit, margin };
}

export default function BasketCard({ basket, onEdit, onArchive, onUnarchive, onDelete, viewMode }: BasketCardProps) {
  const { products } = useApp();
  const isArchived = basket.archived || false;
  const metrics = useMemo(() => calculateBasketMetrics(basket, products), [basket, products]);

  const primaryVariant = basket.variants?.[0];
  const imageUrl = basket.media?.[0]?.url || '/placeholder.png';
  const stock = primaryVariant?.stock ?? basket.stock ?? 0;
  const isLowStock = stock > 0 && stock <= 10;
  const isOutOfStock = stock === 0;

  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)' }}
        className={`relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${
          isArchived ? 'border-slate-300 opacity-70' : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        {isArchived && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <span className="rotate-[-10deg] rounded-xl bg-black/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg ring-2 ring-red-400">
              Arxivləşdirilib
            </span>
          </div>
        )}
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <Image src={imageUrl} alt={basket.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {basket.bestseller && <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">Bestseller</span>}
            {basket.trending && <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">Trend</span>}
            {basket.new && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">Yeni</span>}
          </div>
          {basket.discount && basket.discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">-{basket.discount}%</div>
          )}
          {isOutOfStock && <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">Stok yoxdur</div>}
          {isLowStock && !isOutOfStock && <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">Son {stock} ədəd</div>}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">{basket.name}</h3>
              <p className="text-xs text-slate-500 capitalize">{basket.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-emerald-700">{formatCurrency(metrics.price)}</p>
              {basket.discount && basket.discount > 0 && (
                <p className="text-[10px] text-slate-400 line-through">{formatCurrency(metrics.price / (1 - basket.discount / 100))}</p>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className="rounded-xl bg-slate-50 p-1.5 text-center">
              <div className="text-[10px] text-slate-400">Gəlir</div>
              <div className="text-xs font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-1.5 text-center">
              <div className="text-[10px] text-slate-400">Maya</div>
              <div className="text-xs font-bold text-slate-600">{formatCurrency(metrics.totalCost)}</div>
            </div>
            <div className={`rounded-xl p-1.5 text-center ${metrics.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="text-[10px] text-slate-400">Mənfəət</div>
              <div className={`text-xs font-bold ${metrics.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(metrics.profit)}</div>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Marja</span>
              <span className={`font-bold ${metrics.margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{metrics.margin.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
              <div className={`h-full rounded-full transition-all ${metrics.margin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(metrics.margin), 100)}%` }} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2.5">
            <Button size="sm" variant="ghost" onClick={() => onEdit(basket)} className="flex-1 text-xs">
              <Edit className="w-3.5 h-3.5 mr-1" /> Redaktə
            </Button>
            {isArchived ? (
              <Button size="sm" variant="ghost" onClick={() => onUnarchive(basket.id)} className="text-indigo-600 hover:text-indigo-700">
                <Archive className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => onArchive(basket.id)} className="text-amber-600 hover:text-amber-700">
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDelete(basket.id)} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm transition-all ${
        isArchived ? 'border-slate-300 opacity-70' : 'border-slate-200 hover:border-emerald-200'
      }`}
    >
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        <Image src={imageUrl} alt={basket.name} fill className="object-cover" sizes="80px" />
        {basket.discount && basket.discount > 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">-{basket.discount}%</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 truncate">{basket.name}</h3>
          <span className="text-xs text-slate-500 capitalize">({basket.type})</span>
          {isArchived && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Arxivdə</span>}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
          <span>Stok: {stock}</span>
          <span>Variant: {basket.variants?.length || 0}</span>
          <span>Məhsul: {basket.products?.length || 0}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="font-bold text-emerald-700">{formatCurrency(metrics.price)}</span>
          <span className={`font-semibold ${metrics.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {metrics.profit >= 0 ? '↑' : '↓'} {formatCurrency(metrics.profit)}
          </span>
          <span className="text-slate-400">Marja: {metrics.margin.toFixed(1)}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(basket)}>
          <Edit className="w-4 h-4" />
        </Button>
        {isArchived ? (
          <Button size="sm" variant="ghost" onClick={() => onUnarchive(basket.id)} className="text-indigo-600">
            <Archive className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onArchive(basket.id)} className="text-amber-600">
            <Archive className="w-4 h-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDelete(basket.id)} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}