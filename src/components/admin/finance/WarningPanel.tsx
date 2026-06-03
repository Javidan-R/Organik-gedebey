'use client';

import { AlertTriangle } from 'lucide-react';

export default function WarningPanel({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-800">
        <AlertTriangle className="h-4 w-4 text-rose-600" />
        Diqqət tələb edən siqnallar ({warnings.length})
      </h2>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-rose-700"
          >
            <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
            {w}
          </li>
        ))}
      </ul>
    </section>
  );
}
