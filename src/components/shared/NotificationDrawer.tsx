import { NotificationItem } from "@/types/home"
import { AnimatePresence, motion } from "framer-motion"
import { X, Flame, Package, ShoppingCart, Gift } from "lucide-react"
import { FC } from "react"

export const NotificationDrawer: FC<{
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
}> = ({ isOpen, onClose, notifications }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Bildirişlər</h2>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-4 rounded-2xl border-2 ${n.read ? 'bg-white border-slate-100' : 'bg-emerald-50 border-emerald-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === 'sale' ? 'bg-red-100' : n.type === 'order' ? 'bg-blue-100' : n.type === 'stock' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {n.type === 'sale' && <Flame className="w-5 h-5 text-red-600" />}
                    {n.type === 'order' && <Package className="w-5 h-5 text-blue-600" />}
                    {n.type === 'stock' && <ShoppingCart className="w-5 h-5 text-green-600" />}
                    {n.type === 'promo' && <Gift className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)