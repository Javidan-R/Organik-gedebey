import { OrderStatusDisplay } from "@/types/orders";
import { Clock, CheckCircle2, Ban, AlertTriangle, Package, Truck, RotateCcw } from "lucide-react";
import { ReactNode } from "react";
 
// Status badge – daha aydın, ikonalı

export const StatusBadge: React.FC<{ status: OrderStatusDisplay }> = ({ status }) => {
  let icon: ReactNode;
  let classes =
    'inline-flex items-center gap-[0.25rem] px-[0.6rem] py-[0.25rem] rounded-full text-[0.75rem] font-semibold';

  switch (status) {
    case 'pending':
      icon = <Clock className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-amber-50 text-amber-700 border border-amber-200';
      break;
    case 'confirmed':
      icon = <CheckCircle2 className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-blue-50 text-blue-700 border border-blue-200';
      break;
    case 'preparing':
      icon = <Package className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-purple-50 text-purple-700 border border-purple-200';
      break;
    case 'ready_for_delivery':
      icon = <Package className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-indigo-50 text-indigo-700 border border-indigo-200';
      break;
    case 'shipping':
      icon = <Truck className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-cyan-50 text-cyan-700 border border-cyan-200';
      break;
    case 'delivered':
      icon = <CheckCircle2 className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-emerald-50 text-emerald-700 border border-emerald-200';
      break;
    case 'cancelled':
      icon = <Ban className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-red-50 text-red-700 border border-red-200';
      break;
    case 'refunded':
      icon = <RotateCcw className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-orange-50 text-orange-700 border border-orange-200';
      break;
    default:
      icon = <AlertTriangle className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-slate-50 text-slate-600 border border-slate-200';
  }

  const statusLabels: Record<OrderStatusDisplay, string> = {
    pending: 'Gözləyir',
    confirmed: 'Təsdiqləndi',
    preparing: 'Hazırlanır',
    ready_for_delivery: 'Çatdırılmağa hazır',
    shipping: 'Yolda',
    delivered: 'Çatdırılıb',
    cancelled: 'Ləğv edilib',
    refunded: 'Qaytarıldı',
    out_for_delivery: "Çatdırılmaya yola düşüb"
  };

  return (
    <span className={classes}>
      {icon}
      {statusLabels[status] || status}
    </span>
  )
  
};
