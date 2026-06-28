import { SkeletonProps } from "@/types/products";

export function SkeletonGrid({ viewMode }: SkeletonProps) {
  const items = Array.from({ length: 8 }, (_, i) => i);

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={i}
            className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-sm sm:flex-row"
          >
            <div className="h-40 w-full bg-slate-100 sm:h-28 sm:w-44" />
            <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
              <div>
                <div className="mb-2 h-4 w-3/4 rounded-full bg-slate-100" />
                <div className="mb-2 h-3 w-1/3 rounded-full bg-slate-100" />
                <div className="mt-3 flex gap-2">
                  <span className="h-3 w-20 rounded-full bg-slate-100" />
                  <span className="h-3 w-16 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="mt-3 flex justify-between gap-2">
                <span className="h-8 w-24 rounded-xl bg-slate-100" />
                <span className="h-8 w-16 rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm"
        >
          <div className="mb-3 h-36 rounded-xl bg-slate-100" />
          <div className="mb-2 h-4 w-3/4 rounded-full bg-slate-100" />
          <div className="mb-2 h-3 w-1/2 rounded-full bg-slate-100" />
          <div className="mt-3 flex justify-between gap-2">
            <span className="h-3 w-20 rounded-full bg-slate-100" />
            <span className="h-3 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <span className="h-8 w-20 rounded-xl bg-slate-100" />
            <span className="h-8 w-16 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
