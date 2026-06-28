'use client'

import { useEffect } from 'react'
import { Button } from '@/components/atoms/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel Xətası</h2>
        <p className="text-gray-600 mb-6">
          Admin panelində gözlənilməz bir xəta baş verdi. Zəhmət olmasa səhifəni yeniləyin.
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Yenilə
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/admin/login'}
            className="w-full"
          >
            Login Səhifəsinə Qayıt
          </Button>
        </div>
        {error.message && (
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
