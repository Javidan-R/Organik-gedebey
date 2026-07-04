import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

/**
 * Lazy loading image component with blur-up effect
 * Optimizes image loading for better performance
 */
export function LazyImage({
  src,
  alt,
  fallback,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3C/svg%3E',
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsError(true);
  };

  if (isError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ backgroundImage: `url(${placeholder})`, backgroundSize: 'cover' }}
        />
      )}
      <img
        ref={imgRef}
        src={placeholder}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
