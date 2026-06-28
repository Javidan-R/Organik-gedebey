import { useEffect, useLayoutEffect } from 'react';

/**
 * Custom hook that uses useLayoutEffect on the client and useEffect on the server
 * This avoids hydration mismatches when using useLayoutEffect
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
