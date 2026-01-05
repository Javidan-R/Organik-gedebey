// Labels tab

import { Product } from "@/types/products";
import { Tag, Zap } from "lucide-react";
import CheckboxChip from "../../shared/CheckboxChip";
import FormGroup from "../../shared/FormGroup";
import TagInput from "../../shared/TagInput";

type LabelsTabProps = {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
};

function LabelsTab({ product, setProduct }: LabelsTabProps) {
  return (
    <div className="space-y-6 rounded-2xl bg-white p-4 shadow-inner">
      <FormGroup
        label="Etiketlər (tags)"
        icon={<Tag className="h-4 w-4" />}
        description="Axtarış və filtr üçün. Məs: bal, pendir, orqanik, təzə və s."
      >
        <TagInput
          tags={product.tags ?? []}
          onChange={(tags) => setProduct((s) => ({ ...s, tags }))}
        />
      </FormGroup>

      <div className="space-y-3 border-t border-gray-100 pt-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Zap className="h-4 w-4" />
          Xüsusi statuslar
        </h3>
        <div className="flex flex-wrap gap-3">
          <CheckboxChip
            label="Önə çıxan (featured)"
            checked={!!product.featured}
            onChange={(v) => setProduct((s) => ({ ...s, featured: v }))}
          />
          <CheckboxChip
            label="Mövsümi məhsul"
            checked={!!product.seasonal}
            onChange={(v) => setProduct((s) => ({ ...s, seasonal: v }))}
          />
          <CheckboxChip
            label="Organik"
            checked={!!product.organic}
            onChange={(v) => setProduct((s) => ({ ...s, organic: v }))}
          />
        </div>
      </div>
    </div>
  );
}
export default LabelsTab;