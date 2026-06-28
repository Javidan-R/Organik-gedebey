

// Benefits tab

import { Product } from "@/types/products";
import { Info } from "lucide-react";
import EditableList from "./EditableList";

type BenefitsTabProps = {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
};

function BenefitsTab({ product, setProduct }: BenefitsTabProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-inner">
      <div className="mb-2 flex items-center gap-2 border-b pb-2">
        <Info className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-bold text-gray-800">
          Faydalar, istifadə qaydaları və əlavə məlumatlar
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EditableList
          label="Faydalar"
          items={product.benefits ?? []}
          onChange={(items) =>
            setProduct((s) => ({
              ...s,
              benefits: items,
            }))
          }
          placeholder="Məs: İmmuniteti gücləndirir"
        />
        <EditableList
          label="İstifadə qaydaları"
          items={product.usageTips ?? []}
          onChange={(items) =>
            setProduct((s) => ({
              ...s,
              usageTips: items,
            }))
          }
          placeholder="Məs: Səhərlər acqarına 1 xörək qaşığı"
        />
        <EditableList
          label="Sertifikatlar / keyfiyyət nişanları"
          items={product.certificates ?? []}
          onChange={(items) =>
            setProduct((s) => ({
              ...s,
              certificates: items,
            }))
          }
          placeholder="Məs: Orqanik sertifikat №..."
        />
        <EditableList
          label="Allergenlər"
          items={product.allergens ?? []}
          onChange={(items) =>
            setProduct((s) => ({
              ...s,
              allergens: items,
            }))
          }
          placeholder="Məs: Süd məhsulu, qoz-fındıq izi ola bilər"
        />
      </div>

      <EditableList
        label="Saxlanma qeydləri"
        items={product.storageNotes ?? []}
        onChange={(items) =>
          setProduct((s) => ({
            ...s,
            storageNotes: items,
          }))
        }
        placeholder="Məs: +4…+6°C arasında, günəş şüasından uzaqda saxlayın"
      />
    </div>
  );
}

export default BenefitsTab;