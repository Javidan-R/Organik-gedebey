"use client";

import { Product } from "@/types/products";
/**
 * FreshTodayStoryBar — Premium Edition v3
 *
 * ✦ Animated freshness-gradient story rings (conic sweep)
 * ✦ Featured hero card — günün ən təzə/populyar məhsulu
 * ✦ Quick-peek glassmorphic tooltip (desktop hover)
 * ✦ Mobile bottom-sheet (tap to expand)
 * ✦ Delivery countdown timer (14:00-a qədər)
 * ✦ Infinite delivery-info marquee
 * ✦ Social proof ticker (son sifarişlər)
 * ✦ Freshness pulse ring + score bar
 * ✦ "Yeni" shimmer badge + low-stock tremor
 * ✦ Category tabs with count + active gradient
 */

import {
  motion, AnimatePresence, useMotionValue,
} from "framer-motion";
import {
  Leaf, Truck, Zap, Sun, CheckCircle2,
  ChevronRight, Wheat, Apple, Droplets,
  Clock, MapPin, Star, ShoppingBag, X,
  TrendingUp, Users, Flame, Bell, Plus,
  Timer, ArrowRight, Heart,
} from "lucide-react";
import {
  useState, useRef, useMemo, useEffect,
  useCallback,
} from "react";

/* ════════════════════════════════════════
   TYPES
════════════════════════════════════════ */
export interface FreshStoryItem {
  id: string;
  productName: string;
  farmName: string;
  farmerInitials: string;
  farmerColor: string;
  region: string;
  category: "meyvə" | "tərəvəz" | "süd" | "bal" | "taxıl" | "digər";
  hoursAgo: number;
  availableToday: boolean;
  stockLeft?: number;
  imageEmoji: string;
  imageSrc?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  preOrderAvailable?: boolean;
  pricePerUnit?: string;
  soldToday?: number;
  rating?: number;
}

interface Props {
  onOpenStory: (index: number) => void;
  items?: FreshStoryItem[];
}

/* ════════════════════════════════════════
   DEMO DATA
════════════════════════════════════════ */
const DEMO: FreshStoryItem[] = [
  { id:"1", productName:"Çiçək Balı", farmName:"Bəylər Arıxanası", farmerInitials:"BK", farmerColor:"bg-amber-500", region:"Gədəbəy", category:"bal", hoursAgo:1, availableToday:true, stockLeft:8, imageEmoji:"🍯", isBestSeller:true, pricePerUnit:"18₼/kg", soldToday:24, rating:4.9 },
  { id:"2", productName:"Kənd Südü", farmName:"Əhmədli Ferması", farmerInitials:"ƏF", farmerColor:"bg-sky-500", region:"Gəncə", category:"süd", hoursAgo:1, availableToday:true, stockLeft:15, imageEmoji:"🥛", isNew:true, pricePerUnit:"2.5₼/L", soldToday:31, rating:4.8 },
  { id:"3", productName:"Pomidor", farmName:"Qasımov Bağı", farmerInitials:"QB", farmerColor:"bg-red-500", region:"Gədəbəy", category:"tərəvəz", hoursAgo:3, availableToday:true, imageEmoji:"🍅", pricePerUnit:"3₼/kg", soldToday:17, rating:4.7 },
  { id:"4", productName:"Üzüm", farmName:"Nəcəfov Bağı", farmerInitials:"NB", farmerColor:"bg-purple-500", region:"Gəncə", category:"meyvə", hoursAgo:4, availableToday:true, stockLeft:5, imageEmoji:"🍇", pricePerUnit:"5₼/kg", soldToday:12, rating:4.9 },
  { id:"5", productName:"Kənd Yumurtası", farmName:"Muradov Ferması", farmerInitials:"MF", farmerColor:"bg-amber-600", region:"Göygöl", category:"süd", hoursAgo:2, availableToday:true, imageEmoji:"🥚", isNew:true, pricePerUnit:"6₼/12 əd", soldToday:20, rating:4.8 },
  { id:"6", productName:"Alma (Aport)", farmName:"İsmayılov Bağı", farmerInitials:"İB", farmerColor:"bg-rose-500", region:"Gədəbəy", category:"meyvə", hoursAgo:5, availableToday:true, imageEmoji:"🍎", isBestSeller:true, pricePerUnit:"4₼/kg", soldToday:38, rating:4.9 },
  { id:"7", productName:"Lobya", farmName:"Hüseynov Bağçası", farmerInitials:"HB", farmerColor:"bg-green-700", region:"Gədəbəy", category:"tərəvəz", hoursAgo:6, availableToday:false, preOrderAvailable:true, imageEmoji:"🫘", pricePerUnit:"7₼/kg" },
  { id:"8", productName:"Buğda Unu", farmName:"Kəlbəliyev Dəyirmanı", farmerInitials:"KD", farmerColor:"bg-stone-600", region:"Gəncə", category:"taxıl", hoursAgo:7, availableToday:true, imageEmoji:"🌾", isNew:true, pricePerUnit:"2₼/kg", soldToday:9, rating:4.6 },
  { id:"9", productName:"Qaymaq", farmName:"Əhmədli Ferması", farmerInitials:"ƏF", farmerColor:"bg-sky-500", region:"Gəncə", category:"süd", hoursAgo:2, availableToday:true, stockLeft:4, imageEmoji:"🧈", pricePerUnit:"12₼/250q", soldToday:14, rating:5.0 },
  { id:"10", productName:"Gilas", farmName:"Nəcəfov Bağı", farmerInitials:"NB", farmerColor:"bg-rose-600", region:"Gəncə", category:"meyvə", hoursAgo:3, availableToday:true, imageEmoji:"🍒", isBestSeller:true, pricePerUnit:"8₼/kg", soldToday:41, rating:4.9 },
];

/* ════════════════════════════════════════
   CATEGORY CONFIG
════════════════════════════════════════ */
const CATS = [
  { key:"hamısı",  label:"Hamısı",   emoji:"🌿" },
  { key:"meyvə",   label:"Meyvə",    emoji:"🍎" },
  { key:"tərəvəz", label:"Tərəvəz",  emoji:"🥬" },
  { key:"süd",     label:"Süd məh.", emoji:"🥛" },
  { key:"bal",     label:"Bal",      emoji:"🍯" },
  { key:"taxıl",   label:"Taxıl",    emoji:"🌾" },
] as const;

/* ════════════════════════════════════════
   FRESHNESS HELPER
════════════════════════════════════════ */
function fg(h: number) {
  if (h <= 1)  return { label:`${h} saat əvvəl · Ən təzə`, short:"Ən təzə", from:"#10B981", to:"#6EE7B7", txt:"text-emerald-600", score:100 };
  if (h <= 2)  return { label:`${h} saat əvvəl · Çox təzə`, short:"Çox təzə", from:"#10B981", to:"#A3E635", txt:"text-emerald-600", score:88 };
  if (h <= 4)  return { label:`${h} saat əvvəl · Təzə`, short:"Təzə", from:"#A3E635", to:"#FBBF24", txt:"text-lime-600", score:72 };
  if (h <= 6)  return { label:`${h} saat əvvəl · Yaxşı`, short:"Yaxşı", from:"#FBBF24", to:"#F59E0B", txt:"text-amber-600", score:55 };
  return             { label:`${h} saat əvvəl`, short:"Eyni gün", from:"#F59E0B", to:"#F97316", txt:"text-orange-600", score:40 };
}

/* ════════════════════════════════════════
   DELIVERY COUNTDOWN
════════════════════════════════════════ */
function useDeliveryCountdown() {
  const [left, setLeft] = useState({ h:"--", m:"--", s:"--", done:false });
  useEffect(() => {
    const tick = () => {
      const now = new Date(); const cut = new Date(now); cut.setHours(14,0,0,0);
      if (now >= cut) { setLeft({ h:"00",m:"00",s:"00",done:true }); return; }
      const d = cut.getTime() - now.getTime();
      setLeft({ h:String(Math.floor(d/3_600_000)).padStart(2,"0"), m:String(Math.floor((d%3_600_000)/60_000)).padStart(2,"0"), s:String(Math.floor((d%60_000)/1_000)).padStart(2,"0"), done:false });
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);
  return left;
}

/* ════════════════════════════════════════
   SPINNING GRADIENT RING
════════════════════════════════════════ */
function SpinRing({ from, to, speed=4, dashed=false, low=false }: {
  from:string; to:string; speed?:number; dashed?:boolean; low?:boolean;
}) {
  if (dashed) return (
    <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-300" />
  );
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 rounded-full"
      style={{ background: low
        ? `conic-gradient(from 0deg, #EF4444, #F97316, #EF4444)`
        : `conic-gradient(from 0deg, ${from}, ${to}, ${from})`
      }}
    />
  );
}

/* ════════════════════════════════════════
   QUICK TOOLTIP (desktop)
════════════════════════════════════════ */
function QuickTooltip({ item, visible }: { item: FreshStoryItem; visible: boolean }) {
  const f = fg(item.hoursAgo);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity:0, y:10, scale:0.9 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:8, scale:0.9 }}
          transition={{ duration:0.16, ease:[0.22,1,0.36,1] }}
          className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50
            w-52 bg-white/96 backdrop-blur-xl rounded-2xl
            border border-slate-100/80 shadow-2xl shadow-emerald-900/10 overflow-hidden pointer-events-none"
        >
          <div className="h-[3px]" style={{ background:`linear-gradient(90deg,${f.from},${f.to})` }} />
          <div className="p-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[32px] leading-none select-none">{item.imageEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-900 leading-tight truncate">{item.productName}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.farmName}</p>
              </div>
            </div>
            {/* freshness bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold">
                <span className={f.txt}>{f.short}</span>
                <span className="text-slate-400">{f.score}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width:0 }} animate={{ width:`${f.score}%` }}
                  transition={{ duration:0.6 }} className="h-full rounded-full"
                  style={{ background:`linear-gradient(90deg,${f.from},${f.to})` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="flex items-center gap-1 text-slate-500 font-bold">
                <MapPin className="w-2.5 h-2.5 text-emerald-500" />{item.region}
              </span>
              {item.rating && (
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{item.rating}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-50">
              <span className="text-sm font-black text-emerald-700">{item.pricePerUnit}</span>
              {item.soldToday && (
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />{item.soldToday} bu gün
                </span>
              )}
            </div>
            {item.stockLeft !== undefined && item.stockLeft <= 5 && (
              <motion.div animate={{ opacity:[1,0.6,1] }} transition={{ repeat:Infinity, duration:1 }}
                className="flex items-center gap-1.5 bg-red-50 text-red-600 font-black text-[10px] rounded-xl px-2.5 py-1.5">
                <Flame className="w-3 h-3" />Son {item.stockLeft} ədəd!
              </motion.div>
            )}
            <p className="text-center text-[9px] text-slate-400">klikləyin · tam məlumat</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════
   MOBILE BOTTOM SHEET
════════════════════════════════════════ */
function MobileSheet({ item, onClose, onOpen }: {
  item: FreshStoryItem | null; onClose:()=>void; onOpen:()=>void;
}) {
  const f = item ? fg(item.hoursAgo) : null;
  const dragY = useMotionValue(0);
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
          <motion.div key="sh" drag="y" dragConstraints={{ top:0, bottom:0 }} dragElastic={0.12}
            style={{ y:dragY }}
            onDragEnd={(_, info) => { if(info.offset.y > 60) onClose(); }}
            initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
            transition={{ type:"spring", stiffness:420, damping:36 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-[28px] shadow-2xl pb-8">
            {/* handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>
            {f && <div className="h-0.5 mx-5 rounded-full mt-2 mb-4" style={{ background:`linear-gradient(90deg,${f.from},${f.to})` }} />}
            <div className="px-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${item.farmerColor} bg-opacity-15 bg-slate-50`}>
                  {item.imageEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xl text-slate-900 leading-tight">{item.productName}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px] text-slate-500 font-medium">
                    <div className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-black ${item.farmerColor}`}>
                      {item.farmerInitials[0]}
                    </div>
                    {item.farmName}
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    {item.region}
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              {/* Freshness */}
              {f && (
                <div className="rounded-2xl p-3.5" style={{ background:`${f.from}12`, border:`1px solid ${f.from}30` }}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span style={{ color:f.from }}>{f.label}</span>
                    <span className="text-slate-400">{f.score}% təzə</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${f.score}%` }}
                      transition={{ duration:0.8 }} className="h-full rounded-full"
                      style={{ background:`linear-gradient(90deg,${f.from},${f.to})` }} />
                  </div>
                </div>
              )}
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l:"Qiymət", v:item.pricePerUnit??"—", icon:<ShoppingBag className="w-3.5 h-3.5" /> },
                  { l:"Bu gün", v:item.soldToday?`${item.soldToday} əd`:"—", icon:<TrendingUp className="w-3.5 h-3.5" /> },
                  { l:"Reytinq", v:item.rating?`${item.rating} ★`:"—", icon:<Star className="w-3.5 h-3.5" /> },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <div className="flex justify-center text-emerald-500 mb-1">{s.icon}</div>
                    <p className="font-black text-sm text-slate-800">{s.v}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              {/* Low stock */}
              {item.stockLeft !== undefined && item.stockLeft <= 5 && (
                <motion.div animate={{ opacity:[1,0.7,1] }} transition={{ repeat:Infinity, duration:1.2 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <Flame className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm font-black text-red-700">Yalnız {item.stockLeft} ədəd stokda!</p>
                </motion.div>
              )}
              {/* CTAs */}
              <div className="flex gap-2.5">
                <motion.button whileTap={{ scale:0.95 }} onClick={onOpen}
                  className={`flex-1 flex items-center justify-center gap-2 font-black text-sm rounded-2xl py-3.5 shadow-xl transition-all ${
                    item.availableToday
                      ? "bg-yellow-400 text-emerald-900 shadow-yellow-400/30"
                      : "bg-blue-600 text-white shadow-blue-600/25"
                  }`}>
                  {item.availableToday
                    ? <><ShoppingBag className="w-4 h-4" />Sifariş ver<ArrowRight className="w-4 h-4" /></>
                    : <><Bell className="w-4 h-4" />Sabah üçün sifariş</>}
                </motion.button>
                <button onClick={onOpen}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl px-4">
                  Daha çox <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════
   STORY RING — Premium v3
════════════════════════════════════════ */
function StoryRing({ item, seen, onHover, onTap, isActive, isMobile }: {
  item: FreshStoryItem; seen: boolean;
  onHover:(i: FreshStoryItem|null)=>void;
  onTap:(i: FreshStoryItem)=>void;
  isActive: boolean; isMobile: boolean;
}) {
  const f = fg(item.hoursAgo);
  const isLow = item.stockLeft !== undefined && item.stockLeft <= 5;
  const isUnavail = !item.availableToday;

  return (
    <motion.button
      whileHover={{ y:-4, scale:1.06 }}
      whileTap={{ scale:0.93 }}
      onHoverStart={() => !isMobile && onHover(item)}
      onHoverEnd={() => !isMobile && onHover(null)}
      onClick={() => onTap(item)}
      className="relative flex flex-col items-center gap-2 shrink-0 w-[80px] outline-none group"
    >
      <div className="relative">
        {/* ── RING ── */}
        <div className={`relative w-[74px] h-[74px] rounded-full p-[3px] transition-all duration-300 ${isActive ? "scale-105" : ""}`}>
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {seen
              ? <div className="absolute inset-0 rounded-full bg-slate-200" />
              : isUnavail
              ? <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-300" />
              : <SpinRing from={f.from} to={f.to} speed={3 + item.hoursAgo * 0.25} low={isLow} />
            }
          </div>
          {/* Inner avatar */}
          <div className={`relative z-10 w-full h-full rounded-full overflow-hidden border-[3px] border-white
            flex items-center justify-center ${item.farmerColor} transition-all ${seen ? "opacity-45 grayscale" : ""}`}
            style={isActive && !seen ? { boxShadow:`0 0 22px ${f.from}55` } : {}}>
            {item.imageSrc
              ? <img src={item.imageSrc} alt={item.productName} className="w-full h-full object-cover" />
              : <span className="text-[30px] leading-none select-none">{item.imageEmoji}</span>
            }
          </div>

          {/* "YENİ" badge */}
          {item.isNew && !seen && (
            <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }}
              transition={{ type:"spring", stiffness:500, damping:18 }}
              className="absolute -top-1.5 -right-0.5 z-20 flex items-center gap-0.5
                bg-yellow-400 border-2 border-white rounded-full px-1.5 py-0.5">
              <Zap className="w-2 h-2 text-emerald-900" />
              <span className="text-[7px] font-black text-emerald-900">YENİ</span>
            </motion.div>
          )}
          {/* Bestseller flame */}
          {item.isBestSeller && !item.isNew && !seen && (
            <div className="absolute -top-1.5 -right-0.5 z-20 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
              <Flame className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          {/* Low stock pulse */}
          {isLow && (
            <motion.div animate={{ scale:[1,1.25,1] }} transition={{ repeat:Infinity, duration:0.85 }}
              className="absolute -bottom-1 -right-0.5 z-20 bg-red-500 border-2 border-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              <span className="text-[8px] font-black text-white">{item.stockLeft}</span>
            </motion.div>
          )}
          {/* Pre-order */}
          {item.preOrderAvailable && isUnavail && (
            <div className="absolute -bottom-1 -right-0.5 z-20 bg-blue-500 border-2 border-white rounded-full px-1.5 py-0.5">
              <span className="text-[7px] font-black text-white">SB</span>
            </div>
          )}
          {/* Seen overlay */}
          {seen && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center z-20 bg-white/25">
              <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
            </div>
          )}
        </div>
        {/* Tooltip */}
        <QuickTooltip item={item} visible={isActive && !isMobile} />
      </div>

      {/* Label below ring */}
      <div className="text-center w-full px-0.5 space-y-0.5">
        <p className={`text-[10px] font-black leading-tight line-clamp-2 ${seen ? "text-slate-400" : "text-slate-800"}`}>
          {item.productName}
        </p>
        <p className={`text-[9px] font-semibold ${seen ? "text-slate-300" : f.txt}`}>{f.short}</p>
        {item.pricePerUnit && !seen && (
          <p className="text-[9px] font-black text-emerald-700">{item.pricePerUnit}</p>
        )}
      </div>
    </motion.button>
  );
}

/* ════════════════════════════════════════
   FEATURED HERO CARD
════════════════════════════════════════ */
function FeaturedCard({ item, onClick }: { item: FreshStoryItem; onClick:()=>void }) {
  const f = fg(item.hoursAgo);
  return (
    <motion.button whileHover={{ scale:1.01, y:-2 }} whileTap={{ scale:0.99 }}
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden border border-slate-100 bg-white
        shadow-[0_4px_24px_rgba(5,31,10,0.07)] text-left relative group">
      {/* top bar */}
      <div className="h-[3px]" style={{ background:`linear-gradient(90deg,${f.from},${f.to})` }} />
      <div className="flex items-center gap-4 p-4">
        {/* emoji */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl blur-lg opacity-35" style={{ background:f.from }} />
          <div className="relative w-[62px] h-[62px] rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50
            flex items-center justify-center border border-slate-100 shadow-inner">
            <span className="text-[38px] leading-none select-none">{item.imageEmoji}</span>
          </div>
        </div>
        {/* info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black rounded-full px-2 py-0.5"
              style={{ background:`${f.from}20`, color:f.from }}>⭐ Bu Günün Seçimi</span>
            {item.isBestSeller && (
              <span className="text-[10px] font-black bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5">🔥 Bestseller</span>
            )}
          </div>
          <p className="font-black text-[15px] text-slate-900 leading-tight truncate">{item.productName}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-emerald-500" />{item.farmName}
            </span>
            {item.soldToday && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                {item.soldToday} nəfər bu gün aldı
              </span>
            )}
          </div>
          {/* freshness mini-bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <motion.div initial={{ width:0 }} animate={{ width:`${f.score}%` }}
                transition={{ duration:0.9, ease:[0.22,1,0.36,1] }}
                className="h-full rounded-full"
                style={{ background:`linear-gradient(90deg,${f.from},${f.to})` }} />
            </div>
            <span className="text-[9px] font-bold shrink-0" style={{ color:f.from }}>{f.score}%</span>
          </div>
        </div>
        {/* price + arrow */}
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <span className="font-black text-lg text-emerald-700 leading-none">{item.pricePerUnit}</span>
          {item.stockLeft !== undefined && item.stockLeft <= 5 && (
            <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ repeat:Infinity, duration:1 }}
              className="text-[9px] font-black text-red-600 bg-red-50 rounded-full px-2 py-0.5">
              Son {item.stockLeft}!
            </motion.span>
          )}
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center
            group-hover:bg-yellow-400 transition-all duration-200 shadow-md">
            <ArrowRight className="w-4 h-4 text-white group-hover:text-emerald-900 transition-colors" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ════════════════════════════════════════
   DELIVERY COUNTDOWN PILL
════════════════════════════════════════ */
function DeliveryCountdown() {
  const t = useDeliveryCountdown();
  if (t.done) return null;
  return (
    <div className="flex items-center gap-2 bg-emerald-900 rounded-2xl px-3 py-2 shrink-0">
      <Timer className="w-3 h-3 text-yellow-300 shrink-0" />
      <div className="flex items-center font-black text-xs tabular-nums leading-none">
        {[{ v:t.h, l:"s" },{ v:t.m, l:"d" },{ v:t.s, l:"" }].map(({ v, l }, i) => (
          <span key={i} className="flex items-end">
            <AnimatePresence mode="wait">
              <motion.span key={v}
                initial={{ y:-5, opacity:0 }} animate={{ y:0, opacity:1 }}
                exit={{ y:5, opacity:0 }} transition={{ duration:0.12 }}
                className="text-yellow-300">{v}</motion.span>
            </AnimatePresence>
            <span className="text-emerald-400 text-[9px] mb-px">{l}</span>
            {i < 2 && <span className="text-yellow-500 mx-0.5">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   INFINITE MARQUEE
════════════════════════════════════════ */
const MARQUEE_ITEMS = [
  { icon:<Sun className="w-3 h-3 text-yellow-500" />,         text:"Sübh dərilir, axşam kapıda" },
  { icon:<Truck className="w-3 h-3 text-emerald-500" />,      text:"Eyni gün çatdırılma" },
  { icon:<CheckCircle2 className="w-3 h-3 text-emerald-500" />,text:"100% təzəlik zəmanəti" },
  { icon:<Leaf className="w-3 h-3 text-emerald-500" />,       text:"Kimyəvi qatqısız, sertifikatlı" },
  { icon:<Users className="w-3 h-3 text-blue-500" />,         text:"Hər gün 200+ ailə sifariş verir" },
  { icon:<Star className="w-3 h-3 fill-amber-400 text-amber-400" />, text:"4.9 ulduz · 1200+ rəy" },
];

function DeliveryMarquee() {
  return (
    <div className="overflow-hidden relative py-1">
      <div className="absolute left-0 inset-y-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      <motion.div animate={{ x:[0,"-50%"] }} transition={{ duration:28, repeat:Infinity, ease:"linear" }}
        className="flex items-center gap-3 w-max">
        {[...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item,i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold
            text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1.5">
            {item.icon}{item.text}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════
   SOCIAL PROOF TICKER
════════════════════════════════════════ */
const PROOF = [
  "Samirə H. Çiçək Balı sifariş etdi · 3 dəq əvvəl",
  "Elnur M. Qaymaq sifariş etdi · 7 dəq əvvəl",
  "Aytən K. Üzüm 2kq sifariş etdi · 11 dəq əvvəl",
  "Murad S. Kənd Südü sifariş etdi · 15 dəq əvvəl",
  "Günel R. Gilas 1kq sifariş etdi · 20 dəq əvvəl",
];

function SocialTicker() {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(()=>setI(c=>(c+1)%PROOF.length),3800); return ()=>clearInterval(id); },[]);
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <AnimatePresence mode="wait">
        <motion.p key={i}
          initial={{ y:7, opacity:0 }} animate={{ y:0, opacity:1 }}
          exit={{ y:-7, opacity:0 }} transition={{ duration:0.22 }}
          className="text-[10px] font-bold text-emerald-800 truncate">{PROOF[i]}</motion.p>
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════
   FRESHNESS LEGEND
════════════════════════════════════════ */
function FreshnessLegend() {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {[
        { l:"≤2s", f:"#10B981", t:"#6EE7B7" },
        { l:"3-4s", f:"#A3E635", t:"#FBBF24" },
        { l:"5-6s", f:"#FBBF24", t:"#F59E0B" },
        { l:"7s+",  f:"#F59E0B", t:"#F97316" },
      ].map(s => (
        <div key={s.l} className="flex items-center gap-1 shrink-0">
          <div className="w-3 h-3 rounded-full" style={{ background:`linear-gradient(135deg,${s.f},${s.t})` }} />
          <span className="text-[9px] font-bold text-slate-400">{s.l}</span>
        </div>
      ))}
      <span className="text-[9px] text-slate-300 font-medium">· təzəlik şkalası</span>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════ */
export function FreshTodayStoryBar({ onOpenStory, items = [] as Product[] }: Props) {
  const [cat, setCat] = useState<string>("hamısı");
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<FreshStoryItem|null>(null);
  const [sheet, setSheet] = useState<FreshStoryItem|null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768);
    chk(); window.addEventListener("resize", chk); return () => window.removeEventListener("resize", chk);
  }, []);

  const filtered = useMemo(()=> cat === "hamısı" ? items : items.filter(i=>i.category===cat), [items, cat]);
  const todayItems    = filtered.filter(i => i.availableToday);
  const tomorrowItems = filtered.filter(i => !i.availableToday && i.preOrderAvailable);

  const featured = useMemo(() => {
    const av = items.filter(i => i.availableToday);
    return av.find(i => i.isBestSeller && i.hoursAgo <= 2) ?? av.sort((a,b) => a.hoursAgo - b.hoursAgo)[0] ?? null;
  }, [items]);

  const totalToday = items.filter(i => i.availableToday).length;
  const lowCount   = items.filter(i => i.stockLeft !== undefined && i.stockLeft <= 5).length;

  const handleTap = useCallback((item: FreshStoryItem) => {
    setSeen(s => new Set([...s, item.id]));
    if (isMobile) { setSheet(item); }
    else { onOpenStory(filtered.indexOf(item)); }
  }, [isMobile, filtered, onOpenStory]);

  const handleSheetOpen = useCallback(() => {
    if (!sheet) return;
    const idx = filtered.indexOf(sheet);
    setSheet(null);
    onOpenStory(idx >= 0 ? idx : 0);
  }, [sheet, filtered, onOpenStory]);

  return (
    <>
      <div className="space-y-4">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <motion.span animate={{ scale:[1,2.2,1], opacity:[0.8,0,0.8] }}
                  transition={{ repeat:Infinity, duration:2.2 }}
                  className="absolute inset-0 rounded-full bg-emerald-400" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </div>
              <span className="text-sm font-black text-emerald-900">Bu Gün Gəldi</span>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-full border border-emerald-200/60">
              {totalToday} məhsul
            </span>
            {lowCount > 0 && (
              <motion.span animate={{ opacity:[1,0.6,1] }} transition={{ repeat:Infinity, duration:1.4 }}
                className="text-xs bg-red-100 text-red-600 font-black px-2.5 py-1 rounded-full border border-red-100 flex items-center gap-1">
                <Flame className="w-3 h-3" />{lowCount} az qalıb
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DeliveryCountdown />
            <button className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
              Hamısı <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── SOCIAL PROOF ── */}
        <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl px-3 py-2">
          <SocialTicker />
        </div>

        {/* ── FEATURED CARD ── */}
        {featured && (
          <FeaturedCard item={featured}
            onClick={() => { setSeen(s=>new Set([...s,featured.id])); handleTap(featured); }} />
        )}

        {/* ── CATEGORY TABS ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {CATS.map(({ key, label, emoji }) => {
            const count = items.filter(i => key === "hamısı" || i.category === key).length;
            const active = cat === key;
            return (
              <motion.button key={key} whileHover={{ y:-1 }} whileTap={{ scale:0.95 }}
                onClick={() => setCat(key)}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                }`}>
                <span className="text-[13px] leading-none">{emoji}</span>
                {label}
                <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* ── FRESHNESS LEGEND ── */}
        <FreshnessLegend />

        {/* ── STORY RINGS ── */}
        <AnimatePresence mode="wait">
          <motion.div key={cat}
            initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-14 }} transition={{ duration:0.2 }}>
            {todayItems.length > 0 || tomorrowItems.length > 0 ? (
              <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-3 pt-1 px-0.5">

                {todayItems.map(item => (
                  <StoryRing key={item.id} item={item} seen={seen.has(item.id)}
                    onHover={setHovered} onTap={handleTap}
                    isActive={hovered?.id === item.id || sheet?.id === item.id}
                    isMobile={isMobile} />
                ))}

                {tomorrowItems.length > 0 && (
                  <div className="flex flex-col items-center self-stretch shrink-0 gap-1 mx-1">
                    <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                    <span className="text-[8px] font-black text-slate-400 py-1">SABAH</span>
                    <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                  </div>
                )}

                {tomorrowItems.map(item => (
                  <StoryRing key={item.id} item={item} seen={false}
                    onHover={setHovered} onTap={handleTap}
                    isActive={hovered?.id === item.id || sheet?.id === item.id}
                    isMobile={isMobile} />
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="flex flex-col items-center justify-center py-8 rounded-2xl
                  border border-dashed border-emerald-200 bg-emerald-50/40 gap-2">
                <span className="text-3xl">🌱</span>
                <p className="text-sm font-bold text-emerald-700">Bu kateqoriyada bu gün məhsul yoxdur</p>
                <button onClick={() => setCat("hamısı")}
                  className="text-xs font-black text-emerald-600 bg-emerald-100 rounded-full px-4 py-1.5 mt-1 hover:bg-emerald-200 transition-colors">
                  Hamısına bax
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── DELIVERY MARQUEE ── */}
        <DeliveryMarquee />
      </div>

      {/* ── MOBILE SHEET ── */}
      <MobileSheet item={sheet} onClose={() => setSheet(null)} onOpen={handleSheetOpen} />
    </>
  );
}