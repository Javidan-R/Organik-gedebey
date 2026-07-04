'use client';

import { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

/**
 * Performance monitor component for development
 * Shows real-time performance metrics
 */
export function PerformanceMonitor() {
  const { currentFPS, averageFPS, getWebVitals } = usePerformanceMonitor();
  const [webVitals, setWebVitals] = useState<ReturnType<typeof getWebVitals> | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setWebVitals(getWebVitals());
      
      // Toggle with Ctrl+Shift+P
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          setIsVisible((prev) => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [getWebVitals]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg shadow-lg z-50 font-mono text-xs">
      <div className="space-y-2">
        <div className="font-bold border-b border-gray-600 pb-2 mb-2">
          Performance Monitor
        </div>
        <div className="flex justify-between gap-4">
          <span>FPS:</span>
          <span className={currentFPS < 30 ? 'text-red-400' : 'text-green-400'}>
            {currentFPS}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Avg FPS:</span>
          <span>{averageFPS}</span>
        </div>
        {webVitals && (
          <>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="font-bold mb-2">Web Vitals</div>
              <div className="flex justify-between gap-4">
                <span>LCP:</span>
                <span>{(webVitals.LCP / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>FID:</span>
                <span>{webVitals.FID.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>CLS:</span>
                <span>{webVitals.CLS.toFixed(3)}</span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-2 text-gray-400 text-[10px]">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}
