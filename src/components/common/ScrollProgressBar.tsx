import { useScroll, useSpring, motion } from "framer-motion"
import { FC } from "react"

// Scroll Progress Bar
export const ScrollProgressBar: FC = () => {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-400 via-lime-400 to-amber-400 origin-left z-60"
      style={{ scaleX }}
    />
  )
}
