import { Product, ID } from "@/types/products";
import { Variant } from "framer-motion";
import { DollarSign, Layers, Plus, Trash2 } from "lucide-react";
import { INPUT_BASE } from "../products/ProductEditModal";
import FormGroup from "../../shared/FormGroup";

// Stock tab
type StockTabProps = { product: Product; updateVariant: ( index: number, key: keyof Variant, rawValue: string, ) => void; addVariant: () => void; removeVariant: (id: ID) => void; };

function StockTab({
  product,
  updateVariant,
  addVariant,
  removeVariant,
}: StockTabProps) {
  const primary = product.variants[0];

  // Dropdown Options
  const unitOptions = ["ədəd", "kq", "qram", "litr", "ml", "qutu", "set", "paket" , "banka" , "balon", "meşov", "ramka" ,"dəst"];
  const gradeOptions = ["A", "B", "C", "Premium"];

  return (
    <div className="space-y-8 rounded-2xl bg-white p-5 shadow-inner">

      {/* 🟩 ƏSAS VARİANT */}
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow">
        <div className="mb-3 flex items-center gap-2 border-b border-emerald-300 pb-2">
          <DollarSign className="h-5 w-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-emerald-900">
            Əsas Variant — Standart
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {/* Qiymət */}
          <FormGroup label="Satış Qiyməti (₼)">
            <input
              type="number"
              min={0}
              step="0.01"
              className={INPUT_BASE}
              value={primary.price ?? ""}
              onChange={(e) => updateVariant(0, "price", e.target.value)}
            />
          </FormGroup>

          {/* Stok */}
          <FormGroup label="Stok">
            <input
              type="number"
              min={0}
              step="1"
              className={INPUT_BASE}
              value={primary.stock ?? ""}
              onChange={(e) => updateVariant(0, "stock", e.target.value)}
            />
          </FormGroup>

          {/* Maya */}
          <FormGroup label="Maya Dəyəri (₼)">
            <input
              type="number"
              min={0}
              step="0.01"
              className={INPUT_BASE}
              value={primary.costPrice ?? ""}
              onChange={(e) => updateVariant(0, "costPrice", e.target.value)}
            />
          </FormGroup>

          {/* Daşınma */}
          <FormGroup label="Daşınma / alış xərci (₼)">
            <input
              type="number"
              min={0}
              step="0.01"
              className={INPUT_BASE}
              value={primary.arrivalCost ?? ""}
              onChange={(e) => updateVariant(0, "arrivalCost", e.target.value)}
            />
          </FormGroup>
        </div>

        {/* Əlavə variant sahələri */}
        <div className="mt-4 grid gap-4 md:grid-cols-4">

          <FormGroup label="Unit">
            <select
              className={INPUT_BASE}
              value={primary.unit}
              onChange={(e) => updateVariant(0, "unit", e.target.value)}
            >
              {unitOptions.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Grade">
            <select
              className={INPUT_BASE}
              value={primary.grade}
              onChange={(e) => updateVariant(0, "grade", e.target.value)}
            >
              {gradeOptions.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Minimum stok">
            <input
              type="number"
              className={INPUT_BASE}
              value={primary.minStock ?? ""}
              onChange={(e) => updateVariant(0, "minStock", e.target.value)}
            />
          </FormGroup>

          <FormGroup label="Batch tarixi">
            <input
              type="date"
              className={INPUT_BASE}
              value={primary.batchDate ?? ""}
              onChange={(e) => updateVariant(0, "batchDate", e.target.value)}
            />
          </FormGroup>
        </div>
      </div>

      {/* 🟦 ƏLAVƏ VARİANTLAR */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Layers className="h-4 w-4" />
          Əlavə variantlar
        </h3>

        <button
          onClick={addVariant}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          <Plus className="h-3 w-3" />
          Yeni variant əlavə et
        </button>
      </div>

      <div className="space-y-4">
        {product.variants.slice(1).map((v, idx) => {
          const index = idx + 1;

          return (
            <div
              key={v.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="grid gap-3 md:grid-cols-6">

                {/* VARIANT ADI */}
                <FormGroup label="Variant adı">
                  <input
                    type="text"
                    className={INPUT_BASE}
                    value={v.name}
                    onChange={(e) =>
                      updateVariant(index, "name", e.target.value)
                    }
                    placeholder="Məs: 1 kq, 500 q, 250 ml"
                  />
                </FormGroup>

                {/* Qiymət */}
                <FormGroup label="Qiymət (₼)">
                  <input
                    type="number"
                    step="0.01"
                    className={INPUT_BASE}
                    value={v.price ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "price", e.target.value)
                    }
                  />
                </FormGroup>

                {/* Stok */}
                <FormGroup label="Stok">
                  <input
                    type="number"
                    className={INPUT_BASE}
                    value={v.stock ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "stock", e.target.value)
                    }
                  />
                </FormGroup>

                {/* Maya */}
                <FormGroup label="Maya dəyəri">
                  <input
                    type="number"
                    step="0.01"
                    className={INPUT_BASE}
                    value={v.costPrice ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "costPrice", e.target.value)
                    }
                  />
                </FormGroup>

                {/* Arrival */}
                <FormGroup label="Daşınma xərci">
                  <input
                    type="number"
                    step="0.01"
                    className={INPUT_BASE}
                    value={v.arrivalCost ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "arrivalCost", e.target.value)
                    }
                  />
                </FormGroup>

                {/* DELETE BUTTON */}
                <div className="flex items-end">
                  <button
                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    onClick={() => removeVariant(v.id)}
                  >
                    <Trash2 className="mr-1 inline h-4 w-4" />
                    Sil
                  </button>
                </div>
              </div>

              {/* ALT PARAMETRLƏR */}
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <FormGroup label="Unit">
                  <select
                    className={INPUT_BASE}
                    value={v.unit}
                    onChange={(e) => updateVariant(index, "unit", e.target.value)}
                  >
                    {unitOptions.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Grade">
                  <select
                    className={INPUT_BASE}
                    value={v.grade}
                    onChange={(e) =>
                      updateVariant(index, "grade", e.target.value)
                    }
                  >
                    {gradeOptions.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Minimum stok">
                  <input
                    type="number"
                    className={INPUT_BASE}
                    value={v.minStock ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "minStock", e.target.value)
                    }
                  />
                </FormGroup>

                <FormGroup label="Batch tarixi">
                  <input
                    type="date"
                    className={INPUT_BASE}
                    value={v.batchDate ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "batchDate", e.target.value)
                    }
                  />
                </FormGroup>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default StockTab;