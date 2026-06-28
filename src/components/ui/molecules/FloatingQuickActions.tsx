import { useIsMobile } from "@/hooks/useIsMobile"
import { motion } from "framer-motion"
import { Bell, Search } from "lucide-react"
import { FC } from "react"

export const FloatingQuickActions: FC<{
  onSearch: () => void
  onNotifications: () => void
  notificationCount: number
}> = ({ onSearch, onNotifications, notificationCount }) => {
  const isMobile = useIsMobile()
  if (!isMobile) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-24 right-4 z-40 flex flex-col gap-3"
    >
      {[
        { icon: Bell, action: onNotifications, badge: notificationCount, color: 'bg-emerald-600 text-white', label: 'Bildirişlər' },
        { icon: Search, action: onSearch, badge: 0, color: 'bg-white text-emerald-600 border-2 border-emerald-100', label: 'Axtar' },
      ].map(({ icon: Icon, action, badge, color, label }) => (
        <motion.button
          key={label}
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={action}
          className={`relative h-14 w-14 rounded-full ${color} shadow-2xl flex items-center justify-center`}
          aria-label={label}
        >
          <Icon className="w-6 h-6" />
          {badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center text-white"
            >
              {badge}
            </motion.span>
          )}
        </motion.button>
      ))}
    </motion.div>
  )
}