'use client';
 
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item && item !== 'undefined') {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('LocalStorage read error:', error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const next = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
            window.dispatchEvent(new Event('local-storage'));
          }
          return next;
        });
      } catch (error) {
        console.error('LocalStorage write error:', error);
      }
    },
    [key]
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const item = window.localStorage.getItem(key);
      if (item && item !== 'undefined') {
        try {
          setStoredValue(JSON.parse(item));
        } catch (error) {
          console.error('LocalStorage sync error:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key]);

  return [isClient ? storedValue : initialValue, setValue];
}