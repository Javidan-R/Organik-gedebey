'use client';

import { motion } from 'framer-motion';
import { Edit, Archive, Trash2, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import type { Basket } from '@/types/basket';

interface BasketCardProps {
  basket: Basket;
  onEdit: (basket: Basket) => void;
  onArchive: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode?: 'grid' | 'list';
}
 
export default function BasketCard({ basket, onEdit, onArchive, onUnarchive, onDelete, viewMode }: BasketCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
    >
      <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        {basket.media && basket.media.length > 0 && basket.media[0].url ? (
          <img
            src={basket.media[0].url}
            alt={basket.media[0].altText || basket.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-16 h-16 text-emerald-300" />
        )}
        {basket.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{basket.discount}%
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{basket.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{basket.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            {basket.variants && basket.variants.length > 0 ? (
              <span className="text-2xl font-bold text-emerald-600">
                {basket.variants[0].price} ₼
              </span>
            ) : (
              <span className="text-2xl font-bold text-emerald-600">
                -- ₼
              </span>
            )}
            {basket.discount > 0 && basket.variants && basket.variants.length > 0 && (
              <span className="text-sm text-gray-400 line-through ml-2">
                {basket.variants[0].originalPrice || '--'} ₼
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Stok: {basket.stock ?? 0}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            {basket.type}
          </span>
          {basket.trending && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
          {basket.bestseller && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              Bestseller
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(basket)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Redaktə
          </Button>
          {!basket.archived ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onArchive(basket.id)}
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-1" />
              Arxiv
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnarchive?.(basket.id)}
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-1" />
              Bərpa
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(basket.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
