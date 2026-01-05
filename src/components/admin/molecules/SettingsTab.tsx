
// Settings tab

import { Product } from "@/types/products";
import { AlertTriangle, Settings, Info } from "lucide-react";
import { INPUT_BASE } from "../products/ProductEditModal";
import CheckboxChip from "../../shared/CheckboxChip";
import FormGroup from "../../shared/FormGroup";

type SettingsTabProps = {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
};

function SettingsTab({ product, setProduct }: SettingsTabProps) {
  return (
    <div className="space-y-6 rounded-2xl bg-white p-4 shadow-inner">
      <div className="space-y-4 border-b pb-4">
        <FormGroup
          label="Minimum stok həddi"
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Stok bu həddən aşağı düşəndə admin tərəfdə 'Low stock' xəbərdarlığı üçün istifadə olunacaq."
        >
          <input
            type="number"
            min={0}
            className={INPUT_BASE}
            value={product.minStock ?? ''}
            onChange={(e) =>
              setProduct((s) => ({
                ...s,
                minStock: e.target.value ? parseFloat(e.target.value) : 0,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Settings className="h-4 w-4" />
          Digər parametrlər
        </h3>
        <CheckboxChip
          label="Məhsulu arxiv et (satışdan çıxar)"
          checked={!!product.archived}
          onChange={(v) => setProduct((s) => ({ ...s, archived: v }))}
        />
        {product.archived && (
          <p className="mt-1 rounded-xl bg-red-50 p-2 text-[11px] text-red-600">
            Arxivlənmiş məhsullar storefront tərəfdə görünməyəcək, amma
            statistika və keçmiş sifarişlərdə qalacaq.
          </p>
        )}
      </div>

      <div className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[11px] text-blue-800">
        <p className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>
            Bu bölmə ümumi idarəetmə üçündür. Gələcəkdə buraya dil, SEO, etiket
            sinxronizasiya və s. əlavə etmək mümkündür.
          </span>
        </p>
      </div>
    </div>
  );
}
export default SettingsTab;