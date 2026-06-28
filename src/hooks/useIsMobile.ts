'use client';

import { MOBILE_BREAKPOINT } from '@/const';
import { useState, useEffect } from 'react';

export function useIsMobile(debounceMs = 150): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const check = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(check, debounceMs);
    };
    check();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return isMobile;
}