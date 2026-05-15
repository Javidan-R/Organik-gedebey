/**
 * AR Viewer Component (Placeholder for future AR functionality)
 * Bu component gələcəkdə AR.js və ya 8th Wall ilə inteqrasiya ediləcək
 */

"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, AlertCircle, Maximize2 } from 'lucide-react'
import Image from 'next/image'

interface ARViewerProps {
  productId: string
  productName: string
  productImage: string
  onClose: () => void
}

export default function ARViewer({ 
  productId, 
  productName, 
  productImage,
  onClose 
}: ARViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [arSupported, setArSupported] = useState(false)

  // Check AR support (placeholder)
  useState(() => {
    // Check if WebXR is supported
    if ('xr' in navigator) {
      // @ts-ignore
      navigator.xr?.isSessionSupported('immersive-ar')
        .then((supported: boolean) => {
          setArSupported(supported)
          setIsLoading(false)
        })
        .catch(() => {
          setArSupported(false)
          setIsLoading(false)
        })
    } else {
      setArSupported(false)
      setIsLoading(false)
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
    >
      <div className="relative h-full w-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* AR Viewer Content */}
        <div className="max-w-lg w-full">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto"
            />
          ) : arSupported ? (
            // AR Mode (Future Implementation)
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center">
              <Camera className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                AR Görüntü (Tezliklə)
              </h2>
              <p className="text-white/80 mb-6">
                Bu funksiya hazırlanır. Tezliklə məhsulu evinizə görə biləcəksiniz.
              </p>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ) : (
            // AR Not Supported
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center"
            >
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                AR Dəstəklənmir
              </h2>
              <p className="text-white/80 mb-6">
                AR görüntü üçün WebXR dəstəkli brauzer lazımdır.
                Chrome və ya Safari-nin son versiyasından istifadə edin.
              </p>
              
              {/* Fallback - Regular Image */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4">
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-contain"
                />
              </div>

              <button
                onClick={onClose}
                className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                Bağla
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}