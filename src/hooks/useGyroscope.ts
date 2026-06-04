// src/hooks/useGyroscope.ts
import { useEffect, useState } from 'react';

export function useGyroscope() {
  const [gyro, setGyro] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!window.DeviceOrientationEvent) return;
    const handler = (e: DeviceOrientationEvent) => {
      setGyro({ x: (e.gamma || 0) * 0.5, y: (e.beta || 0) * 0.3 });
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);
  return gyro;
}