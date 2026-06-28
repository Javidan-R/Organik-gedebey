'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/store';

export function StorefrontThemeProvider({ children }: { children: React.ReactNode }) {
  const storefrontConfig = useApp((state) => state.storefrontConfig);
  const fetchInitialData = useApp((state) => state.fetchInitialData);
  const _hasHydrated = useApp((state) => state._hasHydrated);

  useEffect(() => {
    if (!storefrontConfig) return;

    const root = document.documentElement;

    // Apply heading font
    if (storefrontConfig.headingFont) {
      root.style.setProperty('--heading-font', storefrontConfig.headingFont);
    }

    // Apply animation speed
    const animationSpeedMap = {
      slow: 0.8,
      normal: 0.4,
      fast: 0.2,
    };
    const speed = animationSpeedMap[storefrontConfig.animationSpeed || 'normal'];
    root.style.setProperty('--animation-duration', `${speed}s`);

    // Apply UI effects via data attributes
    root.dataset.hoverEffects = storefrontConfig.enableHoverEffects !== false ? 'true' : 'false';
    root.dataset.shadows = storefrontConfig.enableShadows !== false ? 'true' : 'false';
    root.dataset.roundedCorners = storefrontConfig.enableRoundedCorners !== false ? 'true' : 'false';
    root.dataset.gradients = storefrontConfig.enableGradients !== false ? 'true' : 'false';
  }, [storefrontConfig]);

  // Fetch initial data from database after hydration
  useEffect(() => {
    if (_hasHydrated) {
      fetchInitialData();
    }
  }, [_hasHydrated, fetchInitialData]);

  return <>{children}</>;
}
