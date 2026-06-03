// 8. components/admin/finance/ExportButtons.tsx
'use client';

import { Download, FileSpreadsheet } from 'lucide-react';
import { saveAs } from 'file-saver'; // npm install file-saver @types/file-saver
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  monthKey: string;
  data: {
    monthlyStats: any;
    expensePie: any[];
    chartData: any[];
  };
  formatCurrency: (n: number) => string;
}

export default function ExportButtons({ monthKey, data, formatCurrency }: ExportButtonsProps) {
  const exportToCSV = () => {
    const rows = [
      ['Maliyyə Hesabatı', monthKey],
      ['Gəlir', data.monthlyStats.income],
      ['Xərc', data.monthlyStats.exp],
      ['Mənfəət', data.monthlyStats.profit],
      ['Marja', `${data.monthlyStats.margin.toFixed(1)}%`],
      [],
      ['Kateqoriya', 'Məbləğ'],
      ...data.expensePie.map(e => [e.name, e.value]),
    ];
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `maliyye-${monthKey}.csv`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.expensePie);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Xərclər');
    XLSX.writeFile(wb, `maliyye-${monthKey}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
      >
        <Download className="w-4 h-4" /> CSV
      </button>
      <button
        onClick={exportToExcel}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition"
      >
        <FileSpreadsheet className="w-4 h-4" /> Excel
      </button>
    </div>
  );
}