'use client';

import { TimeOfDay } from '@/types/home';
import { useState, useEffect } from 'react';

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      if (h >= 5 && h < 12) setTimeOfDay('morning');
      else if (h >= 12 && h < 18) setTimeOfDay('day');
      else if (h >= 18 && h < 22) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };
    update();
    const interval = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}