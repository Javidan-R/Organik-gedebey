// components/ErrorFallback.tsx
'use client'

export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold text-red-600">Xəta baş verdi!</h2>
      <p className="text-gray-600">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Yenidən cəhd et
      </button>
    </div>
  )
}