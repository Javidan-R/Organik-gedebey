// 9. components/admin/finance/WarningPanel.tsx
'use client';

import { AlertTriangle, Info } from 'lucide-react';

interface WarningPanelProps {
  warnings: string[];
}

export default function WarningPanel({ warnings }: WarningPanelProps) {
  if (!warnings.length) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Diqqət tələb olunan məqamlar</p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}