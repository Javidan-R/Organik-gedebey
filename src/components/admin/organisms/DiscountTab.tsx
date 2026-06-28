
// Discount tab

import { Product } from "@/types/products";
import { Percent, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { INPUT_BASE } from "../products/ProductEditModal";
import FormGroup from "../../shared/FormGroup";

type DiscountTabProps = {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
  discountError: string;
  finalPricePreview: number;
  primaryPrice: number;
};

function DiscountTab({
  product,
  setProduct,
  discountError,
  finalPricePreview,
  primaryPrice,
}: DiscountTabProps) {
  const clearDiscount = () => {
    setProduct((s) => ({
      ...s,
      discountType: undefined,
      discountValue: undefined,
      discountStart: undefined,
      discountEnd: undefined,
    }));
  };

  return (
    <div className="space-y-6 rounded-2xl bg-white p-4 shadow-inner">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Percent className="h-4 w-4" />
          Endirim ayarları
        </h3>
        {(product.discountType || product.discountValue) && (
          <button
            type="button"
            onClick={clearDiscount}
            className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            <Trash2 className="h-3 w-3" />
            Endirimi sil
          </button>
        )}
      </div>

      {discountError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {discountError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <FormGroup label="Endirim növü">
          <select
            className={`${INPUT_BASE} appearance-none`}
            value={product.discountType ?? ''}
            onChange={(e) =>
              setProduct((s) => ({
                ...s,
                discountType: e.target.value
                  ? (e.target.value as 'percentage' | 'fixed')
                  : undefined,
              }))
            }
          >
            <option value="">Seçilmir</option>
            <option value="percentage">Faiz (%)</option>
            <option value="fixed">Sabit məbləğ (₼)</option>
          </select>
        </FormGroup>
        <FormGroup label="Endirim dəyəri">
          <input
            type="number"
            min={0}
            className={INPUT_BASE}
            value={product.discountValue ?? ''}
            onChange={(e) =>
              setProduct((s) => ({
                ...s,
                discountValue: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              }))
            }
          />
        </FormGroup>
        <div className="flex items-center">
          <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 shadow-sm">
            <div className="flex items-center justify-between">
              <span>Əsas qiymət</span>
              <span className="font-semibold">
                {primaryPrice.toFixed(2)} ₼
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>Endirimdən sonra</span>
              <span className="text-base font-extrabold">
                {finalPricePreview.toFixed(2)} ₼
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
        <FormGroup label="Başlama tarixi" icon={<Calendar className="h-4 w-4" />}>
          <input
            type="datetime-local"
            className={INPUT_BASE}
            value={
              product.discountStart
                ? new Date(product.discountStart).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              setProduct((s) => ({
                ...s,
                discountStart: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              }))
            }
          />
        </FormGroup>
        <FormGroup label="Bitiş tarixi" icon={<Calendar className="h-4 w-4" />}>
          <input
            type="datetime-local"
            className={INPUT_BASE}
            value={
              product.discountEnd
                ? new Date(product.discountEnd).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              setProduct((s) => ({
                ...s,
                discountEnd: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              }))
            }
          />
        </FormGroup>
      </div>
    </div>
  );



}
export default DiscountTab;
