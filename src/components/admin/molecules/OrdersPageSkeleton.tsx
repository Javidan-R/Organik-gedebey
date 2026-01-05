
// Skeleton – hydration-dan əvvəl
const OrdersPageSkeleton = () => (
  <div className="space-y-8 p-4 md:p-8 animate-pulse">
    <div className="h-[2rem] w-[16rem] bg-emerald-100 rounded-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1rem]">
      <div className="h-[8rem] bg-white rounded-2xl shadow border border-slate-100" />
      <div className="h-[8rem] bg-white rounded-2xl shadow border border-slate-100" />
      <div className="h-[8rem] bg-white rounded-2xl shadow border border-slate-100" />
    </div>
    <div className="h-[2.8rem] bg-white rounded-2xl shadow border border-slate-100" />
    <div className="h-[20rem] bg-white rounded-2xl shadow border border-slate-100" />
  </div>
);
export default OrdersPageSkeleton;