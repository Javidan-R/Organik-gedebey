'use client';

import { FileText, FileSpreadsheet, FileDown } from 'lucide-react';

export default function ExportButtons({
  onExportPdf,
  onExportExcel,
  onExportCsv,
}: {
  onExportPdf: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onExportPdf}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
      >
        <FileText className="h-3.5 w-3.5" />
        Aylıq PDF
      </button>
      <button
        type="button"
        onClick={onExportExcel}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </button>
      <button
        type="button"
        onClick={onExportCsv}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <FileDown className="h-3.5 w-3.5" />
        CSV
      </button>
    </div>
  );
}
