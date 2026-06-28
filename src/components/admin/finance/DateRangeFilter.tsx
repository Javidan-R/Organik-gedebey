// 7. components/admin/finance/DateRangeFilter.tsx
'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangeFilterProps {
  from: Date;
  to: Date;
  onChange: (range: { from: Date; to: Date }) => void;
}

export default function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const presets = [
    { label: 'Son 7 gün', days: 7 },
    { label: 'Son 30 gün', days: 30 },
    { label: 'Son 90 gün', days: 90 },
  ];

  const handlePreset = (days: number) => {
    onChange({ from: new Date(Date.now() - days * 86400000), to: new Date() });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Calendar className="w-4 h-4" />
        {from.toLocaleDateString('az')} - {to.toLocaleDateString('az')}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 z-20 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {presets.map((preset) => (
            <button
              key={preset.days}
              onClick={() => handlePreset(preset.days)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              {preset.label}
            </button>
          ))}
          <div className="border-t border-slate-100 p-2">
            <p className="text-[10px] text-slate-400 px-2">Özəl interval (tezliklə)</p>
          </div>
        </div>
      )}
    </div>
  );
}