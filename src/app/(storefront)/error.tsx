'use client'

import { useEffect } from 'react'
import { ShoppingBag, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/atoms/button'

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Storefront Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Səhifə Yüklənmədi</h2>
        <p className="text-gray-600 mb-6">
          Gözlənilməz bir problem yarandı. Zəhmət olmasa səhifəni yeniləyin.
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full" >
            <RefreshCw className="w-4 h-4 mr-2" />
            Səhifəni Yenilə
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Ana Səhifəyə Qayıt
          </Button>
        </div>
        {error.message && process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Xəta məlumatları
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
