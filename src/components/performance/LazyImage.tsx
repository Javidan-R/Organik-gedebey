'use client';

import { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { OptimizedImage } from '@/utils/image-optimization';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  fill,
  sizes,
}: LazyImageProps) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

  if (!isVisible) {
    return (
      <div
        ref={ref as any}
        className={`bg-gray-100 animate-pulse ${className || ''}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fill={fill}
      sizes={sizes}
    />
  );
}
