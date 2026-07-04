import Image from 'next/image';
 
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
  sizes,
}: OptimizedImageProps) {
  const blurDataURL = `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f9e7"/>
    </svg>`
  ).toString('base64')}`;

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      className={className}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      placeholder="blur"
      blurDataURL={blurDataURL}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

export function generateImageSizes(breakpoints: { [key: string]: number }): string {
  return Object.entries(breakpoints)
    .map(([bp, w]) => `(max-width: ${bp}px) ${w}vw`)
    .join(', ') + ', 100vw';
}

export const ImageSizes = {
  hero: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw',
  product: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw',
  thumbnail: '(max-width: 768px) 100vw, 150px',
  banner: '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw',
};