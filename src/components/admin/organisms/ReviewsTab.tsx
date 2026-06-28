// Reviews tab

import { Product, ID, Review } from "@/types/products";
import { Star, Clock, Check, Trash2 } from "lucide-react";

type ReviewsTabProps = {
  product: Product;
  approveReview: (productId: ID, reviewId: ID) => void;
  deleteReview: (productId: ID, reviewId: ID) => void;
};

function ReviewsTab({
  product,
  approveReview,
  deleteReview,
}: ReviewsTabProps) {
  const pending: Review[] =
    product.reviews?.filter((r) => !r.approved) ?? [];
  const approved: Review[] =
    product.reviews?.filter((r) => r.approved) ?? [];

  return (
    <div className="space-y-6 rounded-2xl bg-white p-4 shadow-inner">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Star className="h-4 w-4 text-amber-500" />
          Rəylər ({product.reviews?.length ?? 0})
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <Star className="h-4 w-4 fill-amber-400" />
            Təsdiq gözləyən rəylər ({pending.length})
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1 text-xs">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex gap-2 rounded-xl bg-white p-2 shadow-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {r.name}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-gray-600">&quot;{r.text}&quot;</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(r.createdAt).toLocaleString('az-AZ')}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => approveReview(product.id, r.id)}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                    title="Təsdiqlə"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(product.id, r.id)}
                    className="inline-flex items-center justify-center rounded-xl bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700">
            Təsdiqlənmiş rəylər ({approved.length})
          </p>
          <div className="max-h-60 space-y-1 overflow-y-auto pr-1 text-xs">
            {approved.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between rounded-xl bg-white px-2 py-1 shadow-sm"
              >
                <div className="mr-2">
                  <p className="flex items-center gap-2 font-semibold text-gray-800">
                    {r.name}
                    <span className="flex items-center gap-0.5 text-amber-600">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-600 line-clamp-2">
                    &quot;{r.text}&quot;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteReview(product.id, r.id)}
                  className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.reviews?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-400">
          Bu məhsul üçün hələ rəy yoxdur.
        </p>
      )}
    </div>
  );
}
export default ReviewsTab;