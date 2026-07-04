'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sprout, Grid3X3, Zap } from 'lucide-react';
import { Category } from '@/lib/types';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getCategoryMeta } from '@/lib/category-metadata';
import { CategoryCard } from './CategoryCard';
 
export type CategoryViewMode = 'scroll' | 'grid';

export interface CategoryStripProps {
  categories: Category[];
  initialViewMode?: CategoryViewMode;
  onViewModeChange?: (mode: CategoryViewMode) => void;
  maxItems?: number;
  showViewToggle?: boolean;
  title?: string;
  subtitle?: string;
}

export function CategoryStrip({
  categories,
  initialViewMode = 'scroll',
  onViewModeChange,
  maxItems = 18,
  showViewToggle = true,
  title = 'Kateqoriyalar',
  subtitle,
}: CategoryStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });
  const isMobile = useIsMobile();

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [viewMode, setViewMode] = useState<CategoryViewMode>(initialViewMode);
  const [activeIndex, setActiveIndex] = useState(0);

  const visible = useMemo(
    () => categories.filter((c) => !c.archived).slice(0, maxItems),
    [categories, maxItems]
  );

  const featured = useMemo(
    () => [...visible].sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0)).slice(0, 4),
    [visible]
  );

  const metaMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getCategoryMeta>>();
    visible.forEach((c) => map.set(c.id, getCategoryMeta(c.name)));
    return map;
  }, [visible]);

  const productTotal = useMemo(() => visible.reduce((sum, c) => sum + (c._count?.products ?? 0), 0), [visible]);

  // Scroll vəziyyətini izlə (ResizeObserver əlavə edildi)
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 20;
    setShowLeft(el.scrollLeft > threshold);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - threshold);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(el);
    checkScroll();
    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, visible]);

  // Aktiv kateqoriyanı izlə
  useEffect(() => {
    if (viewMode !== 'scroll') return;
    const el = scrollRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((e) => e.isIntersecting);
        if (visibleEntry) {
          const index = Array.from(el.children).indexOf(visibleEntry.target as Element);
          if (index >= 0 && index < visible.length) setActiveIndex(index);
        }
      },
      { root: el, threshold: 0.7 }
    );

    const cards = el.querySelectorAll('[data-category-card]');
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [viewMode, visible.length]);

  const scrollTo = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.children[0]?.clientWidth ?? 120;
    const gap = 12;
    const scrollAmount = (cardWidth + gap) * 2;
    el.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  const handleViewModeChange = (mode: CategoryViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  if (!visible.length) return null;

  const finalSubtitle = subtitle ?? `${visible.length} kateqoriya · ${productTotal} məhsul`;

  return (
    <section ref={containerRef} className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <motion.div
            initial={{ rotate: -90, scale: 0 }}
            animate={isInView ? { rotate: 0, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 shadow-lg shadow-emerald-600/20"
          >
            <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={2} />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute inset-0 rounded-xl sm:rounded-2xl bg-emerald-400/20"
            />
          </motion.div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-emerald-950 tracking-tight">{title}</h2>
            <p className="text-[10px] sm:text-[11px] font-medium text-emerald-600/70">{finalSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showViewToggle && (
            <div className="hidden sm:flex items-center rounded-lg bg-slate-100/80 p-0.5">
              <button
                key={'grid' as const}
                onClick={() => handleViewModeChange('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Şəbəkə</span>
              </button>
            </div>
          )}

          {viewMode === 'scroll' && visible.length > 3 && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => scrollTo('left')}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl border border-emerald-200 bg-white text-emerald-700 flex items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all shadow-sm"
                aria-label="Sola sürüşdür"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo('right')}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl border border-emerald-200 bg-white text-emerald-700 flex items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all shadow-sm"
                aria-label="Sağa sürüşdür"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href="/categories"
            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 px-3 py-1.5 sm:px-3.5 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Hamısı <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        </div>
      </div>

      {viewMode === 'scroll' ? (
        <div className="relative">
          {showLeft && <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-[#f3f9e7] via-[#f3f9e7]/70 to-transparent z-10 pointer-events-none rounded-l-2xl" />}
          {showRight && <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-[#f3f9e7] via-[#f3f9e7]/70 to-transparent z-10 pointer-events-none rounded-r-2xl" />}
          <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-3 scroll-smooth snap-x snap-mandatory">
            {visible.map((cat, i) => (
              <div key={cat.id} data-category-card className="snap-start">
                <CategoryCard
                  category={cat}
                  meta={metaMap.get(cat.id)!}
                  index={i}
                  variant="scroll"
                  isFeatured={featured.some((f) => f.id === cat.id)}
                />
              </div>
            ))}
            <a href="/categories" className="flex flex-col items-center justify-center text-center snap-start shrink-0 w-[90px] sm:w-[110px] md:w-[130px] group">
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-[84px] md:h-[84px] rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50/30 flex items-center justify-center mb-2 group-hover:border-emerald-400 group-hover:bg-emerald-50 group-hover:scale-105 transition-all duration-300">
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">Hamısını gör</span>
            </a>
          </div>
          {isMobile && visible.length > 3 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {visible.slice(0, Math.min(visible.length, 8)).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === activeIndex ? 'h-2 w-5 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm' : 'h-2 w-2 bg-emerald-200 hover:bg-emerald-300'
                  }`}
                  aria-label={`${idx + 1}-ci kateqoriya`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {visible.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} meta={metaMap.get(cat.id)!} index={i} variant="grid" isFeatured={featured.some((f) => f.id === cat.id)} />
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center gap-2 sm:gap-3 px-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-500">Populyar</span>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {featured.map((cat) => (
              <a key={cat.id} href={`/category/${cat.slug}`} className="text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full transition-all hover:shadow-sm">
                {cat.name}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}