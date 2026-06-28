// Basic tab

import { Category } from "@/lib/types";
import { Product } from "@/types/products";
import { Package, Layers, Globe, Info, FileText } from "lucide-react";
import { getInputClass, INPUT_BASE, TEXTAREA_BASE } from "../products/ProductEditModal";
import FormGroup from "../../shared/FormGroup";

type BasicTabProps = {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
  categories: Category[];
  submitted: boolean;
  generateSlug: () => void;
};

function BasicTab({
  product,
  setProduct,
  categories,
  submitted,
  generateSlug,
}: BasicTabProps) {
  const nameValid = product.name.trim().length > 0;
  const categoryValid = !!product.categoryId;

  return (
    <div className="grid gap-6 rounded-2xl bg-white p-4 shadow-inner md:grid-cols-[1.3fr,1.7fr]">
      <div className="space-y-4">
        <FormGroup label="Məhsul adı" icon={<Package />} required>
          <input
            type="text"
            className={getInputClass(nameValid || !submitted)}
            placeholder="Məs: Gədəbəy balı"
            value={product.name}
            onChange={(e) =>
              setProduct((s) => ({ ...s, name: e.target.value }))
            }
            onBlur={generateSlug}
          />
          {!nameValid && submitted && (
            <p className="mt-0.5 text-xs text-red-500">
              Məhsul adı mütləq doldurulmalıdır.
            </p>
          )}
        </FormGroup>

        <FormGroup
          label="Kateqoriya"
          icon={<Layers />}
          description="Məs: Bal, Süd məhsulları, Tərəvəz və s."
          required
        >
          <select
            className={`${getInputClass(
              categoryValid || !submitted,
            )} appearance-none`}
            value={product.categoryId}
            onChange={(e) =>
              setProduct((s) => ({ ...s, categoryId: e.target.value }))
            }
          >
            <option value="">Kateqoriya seçin...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!categoryValid && submitted && (
            <p className="mt-0.5 text-xs text-red-500">
              Kateqoriya seçmək vacibdir.
            </p>
          )}
        </FormGroup>

        <FormGroup
          label="Mənşə / Region"
          icon={<Globe />}
          description="Məs: Gədəbəy, Gəncə, Şəki və s."
        >
          <input
            type="text"
            className={INPUT_BASE}
            placeholder="Məs: Gədəbəy"
            value={product.originRegion ?? ''}
            onChange={(e) =>
              setProduct((s) => ({ ...s, originRegion: e.target.value }))
            }
          />
        </FormGroup>

        <FormGroup
          label="Qısa mənşə mətni"
          icon={<Info />}
          description="Məs: Azərbaycanda istehsal olunub"
        >
          <input
            type="text"
            className={INPUT_BASE}
            placeholder="Məs: Azərbaycanda istehsal olunub"
            value={product.origin ?? ''}
            onChange={(e) =>
              setProduct((s) => ({ ...s, origin: e.target.value }))
            }
          />
        </FormGroup>
      </div>

      <FormGroup
        label="Ətraflı təsvir"
        icon={<FileText />}
        description="Məhsul haqqında insan oxunaqlı, satış yönümlü təsvir yazın."
      >
        <textarea
          className={`${TEXTAREA_BASE} min-h-[260px]`}
          placeholder="Məhsulun dadı, tərkibi, istifadə sahələri, saxlanma qaydaları və s..."
          value={product.description}
          onChange={(e) =>
            setProduct((s) => ({ ...s, description: e.target.value }))
          }
        />
      </FormGroup>
    </div>
  );
}

export default BasicTab;