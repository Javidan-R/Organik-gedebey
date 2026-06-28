import { Order, Product } from './types';
import { productTotalStock } from './calc';

type DemandPoint = { date: string; qty: number };

export function demandSeries(productId: string, orders: Order[], days = 30): DemandPoint[] {
  // Son `days` gün üçün tarix xətləri
  const end = new Date();
  const start = new Date(end.getTime() - days*86400000);
  const map = new Map<string, number>();
  for (let d = new Date(start); d <= end; d = new Date(d.getTime()+86400000)) {
    map.set(d.toISOString().slice(0,10), 0);
  }
  for (const o of orders) {
    const k = o.createdAt.slice(0,10);
    if (!map.has(k)) continue;
    const dayQty = o.items.filter(it=>it.productId===productId).reduce((s,it)=>s+it.qty,0);
    map.set(k, (map.get(k) || 0) + dayQty);
  }
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date, qty])=>({ date, qty }));
}

export function expSmooth(series: number[], alpha = 0.3): number[] {
  if (!series.length) return [];
  const out = [series[0]];
  for (let i=1;i<series.length;i++) {
    out[i] = alpha*series[i] + (1-alpha)*out[i-1];
  }
  return out;
}

export function sellThrough(products: Product[], orders: Order[], days = 14) {
  return products.map(p=>{
    const ser = demandSeries(p.id, orders, days);
    const sold = ser.reduce((s,x)=>s+x.qty,0);
    const onHand = productTotalStock(p);
    const ratio = onHand>0 ? +(sold/onHand*100).toFixed(1) : (sold>0?100:0);
    return { id:p.id, name:p.name, sold, onHand, ratio };
  }).sort((a,b)=>b.ratio-a.ratio);
}

export function forecastPerProduct(p: Product, orders: Order[], opts?: { horizonDays?: number; alpha?: number; leadTimeDays?: number; serviceFactor?: number }) {
  const horizon = opts?.horizonDays ?? 30;
  const alpha = opts?.alpha ?? 0.35;
  const lead = opts?.leadTimeDays ?? 3;      // təchizat gecikməsi (gün)
  const z = opts?.serviceFactor ?? 1.65;     // ~95% xidmət səviyyəsi

  const ser14 = demandSeries(p.id, orders, 14);
  const ser30 = demandSeries(p.id, orders, 30);

  const s14 = expSmooth(ser14.map(x=>x.qty), alpha);
  const s30 = expSmooth(ser30.map(x=>x.qty), alpha);

  const mean14 = (s14.reduce((s,x)=>s+x,0) / Math.max(s14.length,1)) || 0;
  const mean30 = (s30.reduce((s,x)=>s+x,0) / Math.max(s30.length,1)) || 0;

  // sadə std dev (30 günlük)
  const avg30 = mean30;
  const variance = s30.reduce((s,x)=> s + Math.pow(x-avg30,2), 0) / Math.max(s30.length,1);
  const sigma = Math.sqrt(variance);

  const demandPerDay = Math.max(0.01, (mean14*0.6 + mean30*0.4)); // qısa və orta pəncərə kombinasiyası
  const onHand = productTotalStock(p);

  const safetyStock = +(z * sigma * Math.sqrt(lead)).toFixed(2);
  const reorderPoint = +(demandPerDay * lead + safetyStock).toFixed(2);

  const daysOfCover = +(onHand / Math.max(demandPerDay, 0.01)).toFixed(1);
  const recommendedPO = reorderPoint > onHand ? Math.ceil(reorderPoint - onHand) : 0;

  return {
    productId: p.id,
    productName: p.name,
    demandPerDay: +demandPerDay.toFixed(2),
    onHand,
    reorderPoint,
    daysOfCover,
    recommendedPO,
    mean14: +mean14.toFixed(2),
    mean30: +mean30.toFixed(2),
    sigma: +sigma.toFixed(2),
    horizon
  };
}
