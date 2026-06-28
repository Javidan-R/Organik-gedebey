'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Xəta baş verdi</h2>
        <p className="text-gray-600 mb-6">
          Gözlənilməz bir problem yarandı. Zəhmət olmasa yenidən cəhd edin.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Yenidən cəhd et
        </button>
      </div>
    </div>
  )
}
