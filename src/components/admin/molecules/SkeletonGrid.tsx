// components/admin/molecules/SkeletonGrid.tsx
import { memo } from 'react';

interface SkeletonGridProps {
  viewMode: 'grid' | 'list';
}

export const SkeletonGrid = memo(({ viewMode }: SkeletonGridProps) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="h-20 w-20 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-full bg-slate-200" />
              <div className="h-9 w-9 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="h-52 bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-6 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-8 w-1/3 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
});
SkeletonGrid.displayName = 'SkeletonGrid';