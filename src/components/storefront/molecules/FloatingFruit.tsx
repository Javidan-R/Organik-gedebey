import { motion } from "framer-motion";

export  function FloatingFruit({ emoji, delay = 0 }: { emoji: string; delay?: number }) {
  return (
    <motion.span
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: [-4, 3, -4], opacity: 1 }}
      transition={{
        duration: 3.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-lg shadow-md"
    >
      {emoji}
    </motion.span>
  )
}
