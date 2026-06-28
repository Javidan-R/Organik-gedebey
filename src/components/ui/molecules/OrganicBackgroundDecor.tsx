import { motion } from "framer-motion";

export function OrganicBackgroundDecor() {
  return (
    <>
      {/* Main blobs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.65, 0.45], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
        className="pointer-events-none fixed -left-32 -top-32 z-0 h-80 w-80 rounded-full bg-lime-200/50 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.55, 0.35], y: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 11, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none fixed -right-16 top-48 z-0 h-60 w-60 rounded-full bg-amber-200/50 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -25, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ repeat: Infinity, duration: 13, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none fixed bottom-[-80px] left-1/2 z-0 h-72 w-[520px] -translate-x-1/2 rounded-[260px] bg-gradient-to-r from-lime-200/45 via-amber-100/55 to-emerald-200/45 blur-3xl"
      />
      {/* Secondary small blobs */}
      <motion.div
        animate={{ x: [0, 30, 0], opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        className="pointer-events-none fixed top-1/3 left-1/4 z-0 h-32 w-32 rounded-full bg-emerald-300/30 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.15, 0.3, 0.15] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 3 }}
        className="pointer-events-none fixed top-2/3 right-1/4 z-0 h-24 w-24 rounded-full bg-teal-300/25 blur-xl"
      />
      {/* Paper texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/textures/paper-grain.png')] opacity-[0.055] mix-blend-soft-light" />
      {/* Subtle vignette */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(0,30,0,0.04)_100%)]" />
    </>
  )
}
