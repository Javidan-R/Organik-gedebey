
// --------------------------------------------
// INVENTORY SUMMARY

import { Factory, PackageSearch, PiggyBank, ShoppingBag, Store } from "lucide-react";
import ProgressBar from "./ProgressBar";
import StatBadge from "./StatBadge";
import { InventoryStats } from "@/types/finance";
import { currency } from "@/helpers";

export default function InventorySummary({ stats }: { stats: InventoryStats }) {


  return (
    <div className="p-5 rounded-2xl border border-emerald-100 bg-white shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
        <Store className="w-5 h-5 text-emerald-700" />
        Stok & Inventar Paneli
      </h2>
      <p className="text-xs text-slate-600">
        Bu bölmə <b>hazırda anbarda olan məhsul stokunun</b> təxmini maya dəyərini,
        potensial satış gəlirini və ehtimal olunan mənfəəti göstərir. Bu,{" "}
        <b>`əgər hər şeyi satsam, nə qədər qazanaram?`</b> sualına cavabdır.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBadge
          icon={<PackageSearch className="w-4 h-4 text-emerald-700" />}
          label="Stok vahidi"
          value={stats.totalUnits.toLocaleString('az-AZ')}
          description="Mövcud bütün məhsul variantlarının cəmi."
        />
        <StatBadge
          icon={<Factory className="w-4 h-4 text-slate-700" />}
          label="Stokun maya dəyəri"
          value={currency(stats.totalCost)}
          description="Məhsulların təxmini maya dəyəri (AZN)."
        />
        <StatBadge
          icon={<ShoppingBag className="w-4 h-4 text-emerald-700" />}
          label="Potensial satış gəliri"
          value={currency(stats.potentialRevenue)}
          description="Stok tam satılarsa, gələcək gəlir."
        />
        <StatBadge
          icon={<PiggyBank className="w-4 h-4 text-emerald-700" />}
          label="Potensial mənfəət"
          value={currency(stats.potentialProfit)}
          description={`Orta marja: ${stats.avgMargin.toFixed(1)}%`}
          valueClassName={
            stats.potentialProfit >= 0
              ? 'text-emerald-700'
              : 'text-rose-700'
          }
        />
      </div>

      <div className="mt-2 space-y-2">
        <ProgressBar
          label="Stokun gəlirə nisbəti"
          value={
            stats.potentialRevenue > 0
              ? (stats.totalCost / stats.potentialRevenue) * 100
              : 0
          }
        />
        <p className="text-[11px] text-slate-500">
          Stokun maya dəyərinin potensial gəlirə nisbəti nə qədər aşağıdırsa,
          o qədər yaxşıdır. 40–60% aralığı sağlam sayılır.
        </p>
      </div>
    </div>
  );
}


