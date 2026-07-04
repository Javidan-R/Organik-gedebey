// src/components/ui/MediaGallery.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Play,
  ChevronLeft,
  ChevronRight,
  Film,
} from 'lucide-react';
import Image from 'next/image';

export type MediaItem = {
  id?: string;
  type: 'image' | 'video';
  url: string | { url: string } | any;
  alt?: string;
  thumbnail?: string | { url: string } | any;
  title?: string;
  width?: number;
  height?: number;
  provider?: 'youtube' | 'vimeo' | 'local';
  videoId?: string;
};

export type MediaGalleryProps = {
  items: MediaItem[];
  className?: string;
  containerClassName?: string;
  thumbnailClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showThumbnails?: boolean;
  showControls?: boolean;
  allowZoom?: boolean;
  allowFullscreen?: boolean;
  aspectRatio?: 'square' | 'video' | 'auto' | 'portrait' | 'landscape';
  onSlideChange?: (index: number) => void;
  initialIndex?: number;
  thumbnailPosition?: 'bottom' | 'left' | 'right';
  hideThumbnailsOnMobile?: boolean;
};

// ─── Helper: url-i string-ə çevir ─────────────────────────────
function getUrlString(url: any): string {
  if (!url) return '';
  if (typeof url === 'string') return url;
  if (typeof url === 'object' && url.url && typeof url.url === 'string') return url.url;
  if (typeof url === 'object' && url.src && typeof url.src === 'string') return url.src;
  return '';
}

function VideoPlayer({ item, autoPlay, loop, className }: { item: MediaItem; autoPlay?: boolean; loop?: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const videoUrl = getUrlString(item.url);
  const posterUrl = getUrlString(item.thumbnail);

  if (item.provider === 'youtube' && item.videoId) {
    return (
      <div className={`relative w-full h-full ${className || ''}`}>
        <iframe
          src={`https://www.youtube.com/embed/${item.videoId}?autoplay=${autoPlay ? 1 : 0}&loop=${loop ? 1 : 0}&controls=1&rel=0&modestbranding=1`}
          title={item.alt || item.title || 'Video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (item.provider === 'vimeo' && item.videoId) {
    return (
      <div className={`relative w-full h-full ${className || ''}`}>
        <iframe
          src={`https://player.vimeo.com/video/${item.videoId}?autoplay=${autoPlay ? 1 : 0}&loop=${loop ? 1 : 0}&title=0&byline=0&portrait=0`}
          title={item.alt || item.title || 'Video'}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-black ${className || ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        loop={loop}
        controls
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
      />
      {!isLoaded && (
        <button
          onClick={() => videoRef.current?.play()}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play video"
        >
          <Play className="h-16 w-16 text-white opacity-80" />
        </button>
      )}
    </div>
  );
}

export function MediaGallery({
  items,
  className = '',
  containerClassName = '',
  thumbnailClassName = '',
  autoPlay = false,
  loop = false,
  showThumbnails = true,
  showControls = true,
  allowZoom = true,
  allowFullscreen = true,
  aspectRatio = 'video',
  onSlideChange,
  initialIndex = 0,
  thumbnailPosition = 'bottom',
  hideThumbnailsOnMobile = true,
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Normalize all items: ensure url and thumbnail are strings
  const normalizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      url: getUrlString(item.url),
      thumbnail: getUrlString(item.thumbnail),
    }));
  }, [items]);

  const totalItems = normalizedItems.length;
  const safeIndex = Math.min(currentIndex, totalItems - 1);
  const currentItem = totalItems > 0 ? normalizedItems[safeIndex] : undefined;
  const isVideo = currentItem?.type === 'video';

  const goTo = useCallback((index: number) => {
    if (totalItems === 0) return;
    const newIndex = Math.max(0, Math.min(index, totalItems - 1));
    setCurrentIndex(newIndex);
    setZoomLevel(1);
    setIsZoomed(false);
    setPosition({ x: 50, y: 50 });
    onSlideChange?.(newIndex);
  }, [totalItems, onSlideChange]);

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        setIsZoomed(false);
        setZoomLevel(1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setPosition({ x: 50, y: 50 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed || isVideo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: '',
  }[aspectRatio] || '';

  const renderMedia = (item: MediaItem, index: number) => {
    const isActive = index === safeIndex;
    if (!isActive) return null;

    const imageUrl = getUrlString(item.url);

    if (item.type === 'video') {
      return (
        <VideoPlayer
          key={item.id || index}
          item={item}
          autoPlay={autoPlay}
          loop={loop}
          className="w-full h-full"
        />
      );
    }

    if (!imageUrl) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-400">
          Invalid image URL
        </div>
      );
    }

    return (
      <motion.div
        ref={imageRef}
        className="relative w-full h-full overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => allowZoom && setIsZoomed(true)}
        onMouseLeave={() => { setIsZoomed(false); setPosition({ x: 50, y: 50 }); }}
        animate={{
          scale: isZoomed ? zoomLevel : 1,
          x: isZoomed ? -(position.x - 50) * (zoomLevel - 1) * 2 : 0,
          y: isZoomed ? -(position.y - 50) * (zoomLevel - 1) * 2 : 0,
        }}
        transition={{ duration: 0.1 }}
        style={{ transformOrigin: 'center center' }}
      >
        <Image
          src={imageUrl}
          alt={item.alt || 'Media'}
          fill
          className="object-contain"
          priority={index === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </motion.div>
    );
  };

  const renderThumbnails = () => {
    if (!showThumbnails || totalItems <= 1) return null;

    const isVertical = thumbnailPosition === 'left' || thumbnailPosition === 'right';
    const hideMobile = hideThumbnailsOnMobile ? 'hidden sm:flex' : 'flex';
    const thumbClasses = `flex gap-2 overflow-x-auto scrollbar-thin ${isVertical ? 'flex-col overflow-y-auto' : 'flex-row'} ${hideMobile} ${thumbnailClassName}`;

    return (
      <div className={
        `mt-4 ${isVertical ? 'ml-4' : ''} ${thumbnailPosition === 'bottom' ? 'mt-4' : ''} ${thumbnailPosition === 'left' ? 'mr-4 order-first' : ''} ${thumbnailPosition === 'right' ? 'ml-4 order-last' : ''}`
      }>
        <div className={thumbClasses}>
          {normalizedItems.map((item, idx) => {
            const thumbUrl = item.type === 'video' ? item.thumbnail || item.url : item.url;
            const safeThumbUrl = getUrlString(thumbUrl);
            return (
              <button
                key={item.id || idx}
                onClick={() => goTo(idx)}
                className={`relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === safeIndex
                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
                aria-label={`Slide ${idx + 1}`}
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full bg-black/20 flex items-center justify-center">
                    <Film className="h-4 w-4 sm:h-6 sm:w-6 text-white/60" />
                    {safeThumbUrl && (
                      <Image
                        src={safeThumbUrl}
                        alt={item.alt || 'Video thumbnail'}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                ) : (
                  safeThumbUrl ? (
                    <Image
                      src={safeThumbUrl}
                      alt={item.alt || `Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                      No img
                    </div>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderControls = () => {
    if (!showControls || totalItems <= 1) return null;

    return (
      <>
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Əvvəlki"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Növbəti"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          {normalizedItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                idx === safeIndex ? 'bg-white w-4 sm:w-4' : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </>
    );
  };

  const renderTools = () => {
    if (isVideo) return null;

    return (
      <div className="absolute bottom-4 right-4 z-20 flex gap-1 rounded-2xl bg-white/90 backdrop-blur-sm p-1 shadow-lg">
        {allowZoom && (
          <>
            <button onClick={handleZoomOut} className="rounded-xl p-2 hover:bg-slate-100 transition" aria-label="Kiçilt">
              <ZoomOut className="h-4 w-4 text-slate-700" />
            </button>
            <button onClick={handleResetZoom} className="rounded-xl px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
              {Math.round(zoomLevel * 100)}%
            </button>
            <button onClick={handleZoomIn} className="rounded-xl p-2 hover:bg-slate-100 transition" aria-label="Böyüt">
              <ZoomIn className="h-4 w-4 text-slate-700" />
            </button>
          </>
        )}
        {allowFullscreen && (
          <button onClick={toggleFullscreen} className="rounded-xl p-2 hover:bg-slate-100 transition" aria-label="Tam ekran">
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-slate-700" /> : <Maximize2 className="h-4 w-4 text-slate-700" />}
          </button>
        )}
      </div>
    );
  };

  const renderCounter = () => {
    if (totalItems <= 1) return null;
    return (
      <div className="absolute bottom-4 left-4 z-20 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
        {safeIndex + 1} / {totalItems}
      </div>
    );
  };

  if (totalItems === 0) {
    return (
      <div className={`relative w-full aspect-video bg-slate-100 rounded-2xl flex items-center justify-center ${className}`}>
        <span className="text-slate-400 text-sm">Media yoxdur</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectClass} ${className}`}
    >
      <div className={`relative w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl ${containerClassName}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={safeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            {currentItem && renderMedia(currentItem, safeIndex)}
          </motion.div>
        </AnimatePresence>

        {renderControls()}
        {renderTools()}
        {renderCounter()}
      </div>

      {renderThumbnails()}
    </div>
  );
}