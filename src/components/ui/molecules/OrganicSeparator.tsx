import { motion } from "framer-motion";

type SeparatorVariant = "default" | "spring" | "autumn" | "winter"

export function OrganicSeparator({ small, variant = "default" }: { small?: boolean; variant?: SeparatorVariant }) {
  const emojis: Record<SeparatorVariant, string> = {
    default: "🌱", spring: "🌸", autumn: "🍂", winter: "❄️"
  }
  const emoji = emojis[variant]

  return (
    <div className="flex justify-center">
      <div className={`flex items-center gap-2 ${small ? "my-2" : "my-3"}`}>
        <motion.div
          animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className={`h-px ${small ? "w-24" : "w-32"} bg-gradient-to-r from-transparent via-lime-300 to-transparent`}
        />
        <motion.span
          animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className={`inline-flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-lime-100 ${
            small ? "h-6 w-6 text-sm" : "h-9 w-9 text-xl"
          }`}
        >
          {emoji}
        </motion.span>
        <motion.div
          animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
          className={`h-px ${small ? "w-24" : "w-32"} bg-gradient-to-r from-transparent via-lime-300 to-transparent`}
        />
      </div>
    </div>
  )
}