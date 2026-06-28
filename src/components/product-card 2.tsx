// src/components/product-card.tsx
'use client'

import React, { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Sparkles, Zap, Plus, Fingerprint, Eye, Info } from 'lucide-react'
import { useApp } from '@/lib/store'
import { Product } from '@/lib/store'

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, productPriceNow, isDiscountActive } = useApp()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // --- 1. KREATİV NAVİQASİYA (MAUS FİZİKASI) ---
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 200, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 200, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - left) / width - 0.5)
    mouseY.set((e.clientY - top) / height - 0.5)
  }

  // Animativ Transformasiyalar
  const imageRotate = useTransform(smoothX, [-0.5, 0.5], ["-10deg", "10deg"])
  const cardSkew = useTransform(smoothX, [-0.5, 0.5], ["-2deg", "2deg"])
  const glowX = useTransform(smoothX, [-0.5, 0.5], ["-20%", "120%"])
  const glowY = useTransform(smoothY, [-0.5, 0.5], ["-20%", "120%"])

  const currentPrice = productPriceNow(p) || 0
  const hasDiscount = isDiscountActive(p)

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); mouseX.set(0); mouseY.set(0) }}
      style={{ skewY: cardSkew }}
      className="relative group p-[1px] rounded-[3.5rem] bg-gradient-to-br from-transparent via-gray-100 to-transparent hover:from-emerald-400/20 hover:to-blue-400/20 transition-all duration-1000"
    >
      <div className="relative bg-white/80 backdrop-blur-3xl rounded-[3.4rem] p-4 overflow-hidden border border-white">
        
        {/* --- FUNKSİYA 1: DİNAMİK İŞIQ SİSTEMİ (DYNAMIC GLOW) --- */}
        <motion.div 
          className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(16, 185, 129, 0.15) 0%, transparent 50%)`
          }}
        />

        {/* --- VİZUAL BÖLMƏ (THE STAGE) --- */}
        <div className="relative aspect-[4/5] rounded-[2.8rem] overflow-hidden bg-gray-50 shadow-inner">
          <Link href={`/product/${p.slug}`}>
            <motion.div 
              style={{ rotateZ: imageRotate, scale: isHovered ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="w-full h-full relative"
            >
              <Image
                src={p.image || '/placeholder.png'}
                alt={p.name}
                fill
                className="object-cover transition-all duration-700"
              />
            </motion.div>
          </Link>

          {/* FUNKSİYA 2: "SMART LENS" OVERLAY */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-900/10 backdrop-blur-[2px] pointer-events-none flex items-center justify-center"
              >
                <motion.div 
                   initial={{ scale: 0.8, y: 10 }}
                   animate={{ scale: 1, y: 0 }}
                   className="flex gap-3"
                >
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      <Eye className="w-5 h-5 text-gray-900" />
                   </div>
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-emerald-600">
                      <Plus className="w-5 h-5" />
                   </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Badges (Glassmorphism Style) */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {hasDiscount && (
              <motion.div 
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="bg-white/40 backdrop-blur-xl border border-white/40 px-4 py-2 rounded-2xl shadow-sm"
              >
                <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                   <Zap className="w-3 h-3 fill-current" /> EKSTRA
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* --- MƏLUMAT BÖLMƏSİ (THE CONTENT) --- */}
        <div className="mt-8 px-3 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
               <motion.span 
                 animate={{ x: isHovered ? 5 : 0 }}
                 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]"
               >
                 {p.category || 'Orqanik'}
               </motion.span>
               <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{p.name}</h3>
            </div>
            {/* FUNKSİYA 3: REYTİNQ PULSE */}
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
               <Sparkles className="w-3 h-3 text-amber-500 fill-current animate-pulse" />
               <span className="text-[10px] font-bold">4.9</span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-10">
            {/* Qiymət Məntiqi */}
            <div className="relative group/price">
               <AnimatePresence>
                 {isHovered && hasDiscount && (
                   <motion.div 
                     initial={{ opacity: 0, y: -5 }}
                     animate={{ opacity: 1, y: -20 }}
                     className="absolute top-0 left-0 whitespace-nowrap bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg"
                   >
                     TƏLƏSİN! -20%
                   </motion.div>
                 )}
               </AnimatePresence>
               <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900 tracking-tighter">
                    {currentPrice.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-gray-400">₼</span>
               </div>
            </div>

            {/* THE "NEURAL" BUTTON */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addToCart(p.id)}
              className="relative w-16 h-16 bg-gray-900 rounded-[2rem] flex items-center justify-center group/btn overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            >
              {/* Animasiyalı Border (Liquid Effect) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 animate-spin-slow" />
              
              <div className="relative z-10 bg-gray-900 w-[94%] h-[94%] rounded-[1.9rem] flex items-center justify-center text-white">
                <ShoppingBag className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
              </div>

              {/* Hoverda çıxan "+" işarəsi */}
              <motion.div 
                animate={{ y: isHovered ? 0 : 40 }}
                className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
              >
                <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
                   <Plus className="w-8 h-8 font-bold" />
                </div>
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* --- STATUS BAR (SENSORY FEEDBACK) --- */}
        <div className="mt-6 flex items-center gap-3">
           <div className="flex-1 h-[2px] bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: isHovered ? "0%" : "-100%" }}
                transition={{ duration: 1.5 }}
                className="w-full h-full bg-gradient-to-r from-emerald-400 to-blue-500" 
              />
           </div>
           <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">
             {isHovered ? "Səbətə atmağa hazırdır" : "Məhsulun keyfiyyəti 100%"}
           </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </motion.div>
  )
}