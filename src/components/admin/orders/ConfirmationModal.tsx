import { Button } from "@/components/atoms/button";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";

// Confirmation modal – sifariş ləğvi üçün
const ConfirmationModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}> = ({ open, onClose, onConfirm, title, description }) => {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-red-100 p-6"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-[3.4rem] h-[3.4rem] rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-[1.7rem] h-[1.7rem] text-red-500" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Ləğv et
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              <Trash2 className="w-4 h-4 mr-[0.25rem]" />
              Bəli, təsdiqlə
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
export default ConfirmationModal;