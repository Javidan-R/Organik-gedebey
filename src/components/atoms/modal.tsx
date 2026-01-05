import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "./button";

// --- 3.4 Modal ---
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};
export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
        className={`bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col relative ${className}`}
        onClick={(e) => e.stopPropagation()} // Modalı bağlamaqdan qorumaq
      >
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200 flex justify-between items-center rounded-t-3xl shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-700" title="Bağla">
            <X className="w-6 h-6" />
          </Button>
        </div>
        <div className="grow overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  ); 
}
