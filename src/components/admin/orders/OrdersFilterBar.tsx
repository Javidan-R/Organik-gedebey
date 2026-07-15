// src/components/admin/orders/OrdersFilterBar.tsx
'use client';

import React, { useState } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { OrderStatusDisplay } from '@/types/orders';
import { Button } from '@/components/atoms/button';
import { CheckboxInput } from '@/components/atoms';

type Props = {
  searchTerm: string;
  onSearch: (value: string) => void;
  filterStatus: OrderStatusDisplay | 'all';
  onChangeStatus: (status: OrderStatusDisplay | 'all') => void;
  dateStart: string;
  onChangeDateStart: (date: string) => void;
  dateEnd: string;
  onChangeDateEnd: (date: string) => void;
  onlyProblematic: boolean;
  onChangeProblematic: (checked: boolean) => void;
  onResetFilters: () => void;
  isFilterActive: boolean;
  setToday: () => void;
  setLast7Days: () => void;
};

const STATUS_OPTIONS: { value: OrderStatusDisplay | 'all'; label: string }[] = [
  { value: 'all', label: 'Hamısı' },
  { value: 'pending', label: 'Gözləyən' },
  { value: 'confirmed', label: 'Təsdiqlənmiş' },
  { value: 'preparing', label: 'Hazırlanır' },
  { value: 'ready_for_delivery', label: 'Çatdırılmağa hazır' },
  { value: 'out_for_delivery', label: 'Çatdırılır' },
  { value: 'delivered', label: 'Çatdırıldı' },
  { value: 'cancelled', label: 'Ləğv edildi' },
];

export const OrdersFilterBar: React.FC<Props> = ({
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
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const handleSearch = () => {
    onSearch(localSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 space-y-4">
      {/* Search & Status */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Axtarış
          </label>
          <div className="flex mt-1">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ad, telefon..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-l-xl text-sm focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-emerald-500 text-white rounded-r-xl hover:bg-emerald-600 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => onChangeStatus(e.target.value as OrderStatusDisplay | 'all')}
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Başlanğıc
          </label>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => onChangeDateStart(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Son
          </label>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => onChangeDateEnd(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Quick date buttons + problem toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={setToday}
          className="text-xs h-8 rounded-lg"
        >
          <Calendar className="w-3.5 h-3.5 mr-1" />
          Bu gün
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={setLast7Days}
          className="text-xs h-8 rounded-lg"
        >
          <Calendar className="w-3.5 h-3.5 mr-1" />
          Son 7 gün
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <CheckboxInput
            id="problematic"
            label="Problemli sifarişlər"
            checked={onlyProblematic}
            onChange={(checked: boolean) => onChangeProblematic(checked)}   // ✅ Accept boolean directly
          />
          {isFilterActive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onResetFilters}
              className="text-xs h-8 text-amber-600 hover:text-amber-700"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Sıfırla
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};