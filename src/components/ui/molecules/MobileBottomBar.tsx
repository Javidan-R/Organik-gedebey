import { motion, AnimatePresence } from "framer-motion"

export function MobileBottomBar({
  cartCount = 0,
  wishlistCount = 0,
  activePath = "/",
}: {
  cartCount?: number
  wishlistCount?: number
  activePath?: string
}) { 
  const tabs = [
    { href: "/", icon: "🏠", label: "Ana", emoji: true },
    { href: "/products", icon: "🛍️", label: "Məhsullar", emoji: true },
    { href: "/cart", icon: "🛒", label: "Səbət", emoji: true, badge: cartCount },
    { href: "/wishlist", icon: "❤️", label: "Sevimlilər", emoji: true, badge: wishlistCount },
    { href: "/profile", icon: "👤", label: "Profil", emoji: true },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Background blur pill */}
      <div className="mx-3 mb-3 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_-4px_40px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map(tab => {
            const isActive = activePath === tab.href
            return (
              <motion.a
                key={tab.href}
                href={tab.href}
                whileTap={{ scale: 0.85 }}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${
                  isActive ? "bg-emerald-50" : "hover:bg-slate-50"
                }`}
              >
                <motion.span
                  animate={isActive ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="text-xl leading-none"
                >
                  {tab.icon}
                </motion.span>
                <span className={`text-[9px] font-bold transition-colors ${isActive ? "text-emerald-700" : "text-slate-500"}`}>
                  {tab.label}
                </span>

                {/* Active dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-500"
                    />
                  )}
                </AnimatePresence>

                {/* Badge */}
                {(tab.badge ?? 0) > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm"
                  >
                    {(tab.badge ?? 0) > 9 ? "9+" : tab.badge}
                  </motion.div>
                )}
              </motion.a>
            )
          })}
        </div>
      </div>
    </div>
  )
}