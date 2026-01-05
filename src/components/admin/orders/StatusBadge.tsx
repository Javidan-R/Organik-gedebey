import { OrderStatus } from "@/lib/store";
import { Clock, CheckCircle2, Ban, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

// Status badge – daha aydın, ikonalı
const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  let icon: ReactNode;
  let classes =
    'inline-flex items-center gap-[0.25rem] px-[0.6rem] py-[0.25rem] rounded-full text-[0.75rem] font-semibold';

  switch (status) {
    case 'pending':
      icon = <Clock className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-amber-50 text-amber-700 border border-amber-200';
      break;
   
    case 'delivered':
      icon = <CheckCircle2 className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-emerald-50 text-emerald-700 border border-emerald-200';
      break;
    case 'cancelled':
      icon = <Ban className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-red-50 text-red-700 border border-red-200';
      break;
    default:
      icon = <AlertTriangle className="w-[0.8rem] h-[0.8rem]" />;
      classes += ' bg-slate-50 text-slate-600 border border-slate-200';
  }

  return (
    <span className={classes}>
      {icon}
      {status === 'pending' && 'Gözləyir'}
      {status === 'delivered' && 'Çatdırılıb'}
      {status === 'cancelled' && 'Ləğv edilib'}
    </span>
  );
};
export default StatusBadge;