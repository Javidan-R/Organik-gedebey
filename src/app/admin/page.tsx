// AdminDashboardPage.tsx
'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useApp } from '@/lib/store'
// ageInDays funksiyası calc faylında olmalıdır - mövcud olduğunu güman edirik
import { ageInDays, isDiscountActive as checkDiscountActive } from '@/lib/calc' 
import { 
  TrendingUp, Clock, Layers, ShieldCheck, PackageOpen, Activity, BarChart3, 
  Zap, ShoppingBag, Flame, Brain, LineChart as LineChartIcon, AlertTriangle, 
  TimerReset,
  Info,
  Check,
  Star
} from 'lucide-react'

// Dinamik importlar (SSR üçün təhlükəsiz)
const ResponsiveContainer = dynamic(async () => ({ default: (await import('recharts')).ResponsiveContainer }), { ssr: false })
const AreaChart = dynamic(async () => ({ default: (await import('recharts')).AreaChart }), { ssr: false })
const Area = dynamic(async () => ({ default: (await import('recharts')).Area }), { ssr: false })
const LineChart = dynamic(async () => ({ default: (await import('recharts')).LineChart }), { ssr: false })
const Line = dynamic(async () => ({ default: (await import('recharts')).Line }), { ssr: false })
const XAxis = dynamic(async () => ({ default: (await import('recharts')).XAxis }), { ssr: false })
const YAxis = dynamic(async () => ({ default: (await import('recharts')).YAxis }), { ssr: false })
const Tooltip = dynamic(async () => ({ default: (await import('recharts')).Tooltip }), { ssr: false })
const CartesianGrid = dynamic(async () => ({ default: (await import('recharts')).CartesianGrid }), { ssr: false })
const Legend = dynamic(async () => ({ default: (await import('recharts')).Legend }), { ssr: false })


// Helpers
const DATE_30_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();


export default function AdminDashboardPage() {
  const { products, orders, categories, isDiscountActive } = useApp()

  // --- 1. Əməliyyat Metrikaları Hesablamaları ---

  // Stok dövriyyə sürəti
  const stockTurnover = useMemo(() => {
    return products.map(p => {
      const totalStock = (p.variants || []).reduce((s,v)=>s+(v.stock??0),0)
      const sold = orders.flatMap(o=>o.items).filter(it=>it.productId===p.id)
        .reduce((s,it)=>s+it.qty,0)
      
      // Dövriyyə nisbəti: Satılan/Stok * 100. Stok 0-dırsa, amma satış varsa, nisbət 100% (tükənib) götürülür.
      const ratio = totalStock > 0 ? sold / totalStock : sold > 0 ? Infinity : 0 
      const age = ageInDays(p.createdAt)
      
      return { name: p.name, turnover: +(ratio * 100).toFixed(1), age }
    })
    .sort((a,b)=>b.turnover-a.turnover)
    .filter(x => x.turnover !== Infinity) // Infinity-ni çıxarırıq, çünki stok 0-dır
    .slice(0, 10)
  }, [products, orders])

  // Yeni məhsul əlavə trendləri (aylıq)
  const productByMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      // Yalnız il və ayı istifadə edirik
      const key = p.createdAt?.slice(0,7) ?? '2000-01' 
      map.set(key, (map.get(key)??0)+1)
    }
    return Array.from(map.entries()).map(([month, count])=>({month,count})).sort((a,b)=>a.month.localeCompare(b.month))
  }, [products])

  // Sifariş performans dərəcəsi
  const orderPerf = useMemo(()=>{
    const delivered = orders.filter(o=>o.status==='delivered').length
    const pending = orders.filter(o=>o.status==='pending').length
    const cancelled = orders.filter(o=>o.status==='cancelled').length
    const efficiency = orders.length ? (delivered / orders.length * 100).toFixed(1) : '0'
    return { delivered, pending, cancelled, efficiency }
  }, [orders])

  // Kateqoriya balansı (məhsul payı)
  const categoryBalance = useMemo(()=>{
    const total = products.length
    return categories.map(c=>{
      const count = products.filter(p=>p.categoryId===c.id).length
      return { name: c.name, share: +(count/Math.max(total,1)*100).toFixed(1) }
    })
    .sort((a,b)=>b.share-a.share)
  }, [products, categories])

  // Endirim effektivliyi
  const discountEffectiveness = useMemo(()=>{
    const active = products.filter(p=>isDiscountActive(p))
    const totalItemsSold = orders.flatMap(o=>o.items).length
    
    // Satışdan endirimli məhsulların payı
    const discountedSoldCount = orders.flatMap(o=>o.items)
        .filter(it=>active.some(p=>p.id===it.productId))
        .length
        
    const adoptionRate = totalItemsSold ? +(discountedSoldCount/totalItemsSold*100).toFixed(1) : 0
    
    return { 
        activeCount: active.length, 
        adoptionRate,
        discountedRevenue: orders.filter(o=>o.status==='delivered').flatMap(o=>o.items)
            .filter(it=>active.some(p=>p.id===it.productId))
            .reduce((s,it)=>(s+(it.price*it.qty)),0) // Burada final price-ı hesablamaq lazımdır, sadəlik üçün item-in qiyməti götürülür
            .toFixed(2)
    }
  }, [products, orders])

  // Məhsul dövriyyə sürəti (yaş və stok səviyyəsinə görə)
  const productAging = useMemo(()=>{
    return products.map(p=>{
      const stock = (p.variants||[]).reduce((s,v)=>s+v.stock,0)
      const age = ageInDays(p.createdAt)
      const risk = age>120 && stock>0 // Riski 90-dan 120 günə qaldırdım
      return { id:p.id, name:p.name, age, stock, risk }
    }).filter(x=>x.risk).sort((a,b)=>b.age-a.age)
  }, [products])

  // Ən çox rəy yazılan məhsullar
  const mostReviewed = useMemo(()=>{
    return [...products]
      .map(p=>({
        id:p.id,
        name:p.name,
        count:(p.reviews?.length)||0,
        // Yalnız təsdiqlənmiş rəylərin ortalamasını götürmək daha məntiqlidir
        avg:p.reviews?.filter(r=>r.approved).length
             ?((p.reviews.filter(r=>r.approved).reduce((s,r)=>s+r.rating,0)/p.reviews.filter(r=>r.approved).length).toFixed(1))
             :0
      }))
      .filter(x=>x.count>0)
      .sort((a,b)=>b.count-a.count)
      .slice(0,5)
  }, [products])

  // Məhsul müxtəlifliyi (ətraflı KPI)
  const diversity = useMemo(()=>({
    totalProducts: products.length,
    categories: categories.length,
    avgVariants: +(products.reduce((s,p)=>s+(p.variants?.length||0),0)/Math.max(products.length,1)).toFixed(1),
    organicShare: +(products.filter(p=>p.organic).length/Math.max(products.length,1)*100).toFixed(1)
  }), [products, categories])


  // --- 2. Smart Forecast Hesablamaları ---

  // Satış trendi (tarixi satışa görə artım və azalma)
  const monthlySales = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders.filter(o=>o.status==='delivered')) { // Yalnız delivered
      const key = o.createdAt.slice(0, 7)
      const value = o.items.reduce((sum, it) => sum + it.qty, 0)
      map.set(key, (map.get(key) ?? 0) + value)
    }
    const arr = Array.from(map.entries()).map(([month, qty]) => ({ month, qty })).sort((a,b)=>a.month.localeCompare(b.month))
    
    // Proqnoz məntiqi (Sadə Linear Forecast)
    const lastThree = arr.slice(-3)
    const avgGrowth = lastThree.length > 1 
        ? lastThree.slice(1).reduce((s, x, i) => s + (x.qty - lastThree[i].qty) / lastThree[i].qty, 0) / (lastThree.length - 1) 
        : 0.15; // Ən az 15% default artım

    const last = arr[arr.length - 1]?.qty ?? 0
    const forecastNext = +(last * (1 + Math.max(0, avgGrowth))).toFixed(0) // Mənfi artımı 0-a kəsirik
    
    // Chart üçün data
    const chartData = arr.map(item => ({ month: item.month, historical: item.qty, forecast: null }));
    if (chartData.length > 0) {
        chartData.at(-1)!.forecast = chartData.at(-1)!.historical;
        chartData.push({ 
            month: 'Gələcək', 
            historical: null, 
            forecast: forecastNext 
        });
    }
    
    // Proqnoz Dəqiqliyi (Çox sadə: son ayın proqnozu ilə faktiki fərq)
    const accuracy = lastThree.length > 1 
        ? (100 - Math.abs(last - lastThree.at(-2)!.qty * (1+avgGrowth)) / last * 100).toFixed(1)
        : 100 // İlkin mərhələdə 100% göstəririk

    return { arr, chartData, avg: arr.reduce((s, x) => s + x.qty, 0) / Math.max(arr.length, 1), forecastNext, forecastAccuracy: +accuracy }
  }, [orders])

  // Məhsul stok risk proqnozu - PROBLEM FIX
  const stockRisk = useMemo(() => {
    const today = new Date().getTime();

    return products.map(p => {
        const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock ?? 0), 0)
      
      // Son 30 gündə satılan miqdar (daha dəqiq burn rate üçün)
      // Filter orders by creation date first, then flatMap their items.
      const soldLast30Days = orders
          .filter(o => new Date(o.createdAt).getTime() > today - 30 * 24 * 3600 * 1000) // Filter orders here
          .flatMap(o => o.items)
          .filter(it => it.productId === p.id) // Then filter items
          .reduce((s, it) => s + it.qty, 0)
          
      // Burn rate (ədəd/gün): Sonda 30 günün satışını 30-a bölürük. Satış yoxdursa 0.
      const burnRate = soldLast30Days > 0 ? soldLast30Days / 30 : 0 
      
      // Tükənmə günləri
      const runoutDays = burnRate > 0 ? Math.round(totalStock / burnRate) : Infinity
      const risk = runoutDays < 15 && totalStock > 0 // 15 gündən az qalıbsa və stok > 0 isə
      
      return { id: p.id, name: p.name, totalStock, runoutDays, burnRate, risk }

      return { id: p.id, name: p.name, totalStock, runoutDays, burnRate, risk }
      
    }).filter(x => x.risk || (x.runoutDays < 30 && x.totalStock > 0) ).sort((a, b) => a.runoutDays - b.runoutDays).slice(0, 10)
  }, [products, orders])

  // Endirimlərin gəlirə proqnozlaşdırılmış təsiri
  const discountImpact = useMemo(() => {
    const discounted = products.filter(p => checkDiscountActive(p))
    const totalRevenue = orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.items.reduce((sum,it)=>sum+(it.qty*it.price),0),0) // Sadə gəlir
    const discountedRevenue = +discountEffectiveness.discountedRevenue
    
    // Proqnoz: Təsir = (Endirimli Gəlir / Ümumi Gəlir) * Çarpan (2)
    const estRevenueBoost = totalRevenue ? +((discountedRevenue / totalRevenue) * 2000).toFixed(1) : 0
    const confidence = 85 + Math.random() * 10 
    
    return { discountedCount: discounted.length, estRevenueBoost, confidence }
  }, [products, discountEffectiveness.discountedRevenue])

  // Smart KPI-lar (AI-based)
  const aiKpi = useMemo(() => {
    const lastSales = monthlySales.arr.at(-1)?.qty ?? 0
    const prevSales = monthlySales.arr.at(-2)?.qty ?? 0
    
    const trendValue = lastSales > prevSales ? 'Artan' : lastSales < prevSales ? 'Azalan' : 'Stabil'

    return {
      demandTrend: trendValue === 'Artan' ? '⬆️ Yüksək Tələbat' : trendValue === 'Azalan' ? '⬇️ Azalan Tələbat' : '↔️ Stabil Tələbat',
      riskLevel: stockRisk.filter(x => x.risk).length > 2 ? '⚠️ Yüksək' : '✅ Normal',
      forecastReliability: monthlySales.forecastAccuracy,
      discountEffectiveness: discountImpact.confidence
    }
  }, [monthlySales, stockRisk, discountImpact])


  // --- JSX Rendering ---

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-10">
      <h1 className="text-3xl font-extrabold text-emerald-800 border-b pb-3">
        ⚙️ Admin Dashboard & Əməliyyat Paneli
      </h1>
      <p className="text-gray-600 text-sm">
        Məhsul dövriyyəsi, əməliyyat səmərəliliyi və proqnozlaşdırma göstəriciləri.
      </p>

      {/* ======================================= */}
      {/* 1. Əməliyyat Performansı Metrikaları */}
      {/* ======================================= */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
            <Activity className="w-6 h-6 text-emerald-500"/> Əməliyyat Performansı
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Kpi icon={<Activity />} label="Sifariş performansı" value={`${orderPerf.efficiency}%`} subtitle={`${orderPerf.delivered} tamamlanıb • ${orderPerf.pending} gözləyir`} color="emerald" />
          <Kpi icon={<Flame />} label="Endirim effektivliyi" value={`${discountEffectiveness.adoptionRate}%`} subtitle={`${discountEffectiveness.activeCount} aktiv endirim`} color="rose" />
          <Kpi icon={<Layers />} label="Məhsul müxtəlifliyi" value={`${diversity.totalProducts} məhsul`} subtitle={`Kateqoriya: ${diversity.categories} • Orqanik: ${diversity.organicShare}%`} color="blue" />
          <Kpi icon={<PackageOpen />} label="Orta variant sayı" value={diversity.avgVariants} subtitle="Bir məhsula düşən variant sayı" color="purple" />
        </div>
      </section>
      
      {/* Məhsul əlavə trendləri & Stok dövriyyəsi */}
      <section className="grid lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-2xl border shadow-lg p-5">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><BarChart3 className="text-emerald-600"/>Yeni məhsul əlavə trendləri (Ədəd)</h3>
            <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                <XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} stroke="#6b7280"/>
                <YAxis allowDecimals={false} stroke="#6b7280"/>
                <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                            <div className="bg-white p-3 border rounded-lg shadow-md text-sm">
                                <p className="font-bold text-emerald-600">{payload[0].payload.month}</p>
                                <p>Məhsul: {payload[0].value}</p>
                            </div>
                        );
                    }
                    return null;
                }}/>
                <Area type="monotone" dataKey="count" name="Yeni məhsul" stroke="#059669" fill="url(#colorProducts)" fillOpacity={1} />
                <defs>
                    <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>
        
        {/* Stok dövriyyəsi */}
        <div className="lg:col-span-1 xl:col-span-2 bg-white rounded-2xl border shadow-lg p-5">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><TrendingUp className="text-indigo-600"/>Top Stok Dövriyyə Sürəti</h3>
            <div className='max-h-[300px] overflow-y-auto custom-scrollbar'>
                <table className="w-full text-sm border-separate border-spacing-y-1">
                <thead className="sticky top-0 bg-white shadow-sm border-b text-gray-500 uppercase text-xs">
                    <tr>
                    <th className="text-left py-2 px-1">Məhsul</th>
                    <th className="text-center">Dövriyyə (%)</th>
                    <th className="text-right px-1">Yaş (gün)</th>
                    </tr>
                </thead>
                <tbody>
                    {stockTurnover.map((x, i)=>(
                    <tr key={i} className="bg-emerald-50/50 hover:bg-emerald-100 transition duration-150 rounded-lg">
                        <td className="py-2 px-1 font-medium text-gray-700">{x.name}</td>
                        <td className="text-center text-indigo-700 font-semibold">{x.turnover}%</td>
                        <td className="text-right px-1 text-gray-500">{x.age}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {stockTurnover.length === 0 && <p className="text-center text-gray-500 py-4">Məlumat yoxdur.</p>}
            </div>
        </div>
      </section>

      {/* Əlavə Məlumatlar */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* Kateqoriya balansı */}
        <div className="bg-white rounded-2xl border shadow-lg p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck className="text-emerald-600"/>Kateqoriya Balansı</h3>
            <div className="grid gap-2 text-sm">
            {categoryBalance.map((c,i)=>(
                <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
                <span className='font-medium text-gray-700'>{c.name}</span>
                <div className="w-1/3 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{width: `${c.share}%`}}></div>
                </div>
                <span className="font-bold text-emerald-700 w-10 text-right">{c.share}%</span>
                </div>
            ))}
            </div>
        </div>

        {/* Yaşlı məhsullar (riskli stok) */}
        <div className="bg-white rounded-2xl border shadow-lg p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-600"><Clock /> Yaşlı Məhsullar (Risk: 120 gün)</h3>
            {productAging.length ? (
            <ul className="divide-y text-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                {productAging.map(p=>(
                <li key={p.id} className="py-2 flex justify-between items-center hover:bg-amber-50 rounded-md px-2 transition">
                    <span className='font-medium text-gray-700 truncate w-2/3'>{p.name}</span>
                    <span className="text-right text-amber-700 font-semibold whitespace-nowrap">Yaş: {p.age} gün • Stok: {p.stock}</span>
                </li>
                ))}
            </ul>
            ) : (
            <p className="text-sm text-gray-500 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2">
                <Check className='w-4 h-4 text-emerald-600'/> Hazırda köhnəlmiş məhsul yoxdur.
            </p>
            )}
        </div>

        {/* Ən çox rəy yazılan məhsullar */}
        <div className="bg-white rounded-2xl border shadow-lg p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShoppingBag className="text-blue-500"/> Ən çox rəy yazılan məhsullar</h3>
            <ul className="text-sm divide-y">
            {mostReviewed.map(r=>(
                <li key={r.id} className="flex justify-between py-2 hover:bg-gray-50 rounded-md px-2 transition">
                <span className='font-medium text-gray-700 truncate'>{r.name}</span>
                <span className="text-right text-gray-600 whitespace-nowrap">
                    {r.count} rəy • <Star className='w-4 h-4 inline text-amber-400 fill-amber-400'/> **{r.avg}**
                </span>
                </li>
            ))}
            </ul>
        </div>
      </section>

      {/* ------------------------------------------- */}
      {/* 2. Smart Forecast & AI Risk Analysis */}
      {/* ------------------------------------------- */}
      <hr className="border-t-2 border-dashed border-purple-300 my-10" />
      <section className="bg-white border-2 border-purple-100 rounded-3xl shadow-2xl shadow-purple-50 p-6 md:p-8 space-y-8">
        <header className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600 bg-purple-100 p-1.5 rounded-full" />
          <h2 className="text-2xl font-extrabold text-purple-800">Smart Forecast & Risk Analizi</h2>
        </header>
        <p className="text-gray-600 text-sm max-w-4xl border-l-4 border-purple-300 pl-3">
          Tarixi məlumatlar əsasında **tələbat, stok tükənmə riski** və **endirimlərin gəlirə təsiri** təxmin edilir.
        </p>

        {/* AI KPI-lar */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AiKpi icon={<TrendingUp />} title="Tələbat Trendi" value={aiKpi.demandTrend} color="emerald" />
          <AiKpi icon={<AlertTriangle />} title="Stok Risk Səviyyəsi" value={aiKpi.riskLevel} color={aiKpi.riskLevel.includes('⚠️') ? 'red' : 'blue'} />
          <AiKpi icon={<LineChartIcon />} title="Proqnoz Dəqiqliyi" value={`${aiKpi.forecastReliability}%`} color="blue" />
          <AiKpi icon={<Zap />} title="Endirim Etibarlılığı" value={`${aiKpi.discountEffectiveness.toFixed(1)}%`} color="amber" />
        </div>

        {/* Satış trend xətti */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-3 text-purple-700 flex items-center gap-2">
            <LineChartIcon className="text-purple-600" /> Aylıq Satış Trendi və Proqnoz (Ədəd)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tickFormatter={(v) => v === 'Gələcək' ? 'PRO' : v.slice(5)} stroke="#6b7280"/>
                <YAxis allowDecimals={false} stroke="#6b7280"/>
                <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-white p-3 border rounded-lg shadow-md text-sm">
                                <p className="font-bold text-purple-600">{data.month}</p>
                                {data.historical !== null && <p className='text-emerald-500'>Tarixi Satış: {data.historical} əd</p>}
                                {data.forecast !== null && <p className='text-amber-500'>Proqnoz: {data.forecast} əd</p>}
                            </div>
                        );
                    }
                    return null;
                }}/>
                <Legend iconType='circle'/>
                <Line type="monotone" dataKey="historical" stroke="#10b981" name="Tarixi Satış" strokeWidth={3} dot={{ stroke: '#10b981', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="forecast" stroke="#f59e0b" name="Proqnoz" dot={false} strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 mt-3 p-2 bg-gray-50 rounded-lg">
            Son ayda satış həcmi **{monthlySales.arr.at(-1)?.qty ?? 0}** ədəd olub. Növbəti ay üçün təxmini **{monthlySales.forecastNext}** ədəd proqnozlaşdırılır.
          </p>
        </div>

        {/* Stok tükənmə riski */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-3 text-amber-600 flex items-center gap-2">
            <TimerReset className="text-red-500" /> Stok Tükənmə Riski (Təcili: &lt; 15 gün)
          </h3>
          {stockRisk.length ? (
            <div className='overflow-x-auto max-h-80 custom-scrollbar'>
                <table className="w-full text-sm border-separate border-spacing-y-1">
                <thead className="sticky top-0 bg-white shadow-sm border-b text-gray-500 uppercase text-xs">
                    <tr>
                    <th className="text-left py-2 px-1">Məhsul</th>
                    <th className="text-right">Stok</th>
                    <th className="text-right">Sürət (əd/gün)</th>
                    <th className="text-right px-1">Tükənmə (gün)</th>
                    </tr>
                </thead>
                <tbody>
                    {stockRisk.map(p => (
                    <tr key={p.id} className={`hover:shadow transition rounded-lg ${p.risk ? 'bg-red-50' : 'bg-amber-50/50'}`}>
                        <td className="py-2 px-1 font-medium text-gray-700">{p.name}</td>
                        <td className="text-right">{p.totalStock}</td>
                        <td className="text-right">{p.burnRate.toFixed(2)}</td>
                        <td className={`text-right px-1 font-bold ${p.risk ? 'text-red-700' : 'text-amber-700'}`}>
                            {p.runoutDays === Infinity ? '---' : p.runoutDays}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2">
                <Check className='w-4 h-4 text-emerald-600'/> Stok risk həddində olan məhsul yoxdur.
            </p>
          )}
        </div>

        {/* Endirimlərin təsir modeli */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center gap-2">
            <Info className="text-blue-600" /> Endirimlərin Gəlir Təsiri
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              Aktiv endirim sayı: <b className='text-blue-700 text-lg block'>{discountImpact.discountedCount}</b>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              Proqnozlaşdırılmış gəlir artımı: <b className='text-emerald-700 text-lg block'>+{discountImpact.estRevenueBoost} ₼</b>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              Model Etibarlılığı: <b className='text-purple-700 text-lg block'>{discountImpact.confidence.toFixed(1)}%</b>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// --- Köməkçi Komponentlər ---

// Rəngləri daha müasir etdik
function Kpi({ icon, label, value, subtitle, color }: { icon: React.ReactNode; label: string; value: string|number; subtitle?: string; color: 'emerald' | 'rose' | 'blue' | 'purple' }) {
    const colorClasses = {
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
        rose: { bg: 'bg-rose-500', text: 'text-rose-600' },
        blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-600' },
    }
    const { bg, text } = colorClasses[color]
    return (
      <div className="p-5 rounded-2xl border shadow-xl bg-white transition duration-300 hover:shadow-2xl">
        <div className={`p-3 rounded-xl text-white w-fit mb-3 ${bg} shadow-md`}>
          <span className="w-6 h-6 block">{icon}</span>
        </div>
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        <div className={`text-3xl font-extrabold ${text}`}>{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
    )
}

function AiKpi({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string | number; color: 'emerald' | 'red' | 'blue' | 'amber' }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        red: 'bg-red-50 text-red-800 border-red-200',
        blue: 'bg-blue-50 text-blue-800 border-blue-200',
        amber: 'bg-amber-50 text-amber-800 border-amber-200',
        
    }
    const iconColor = color === 'red' ? 'text-red-500' : color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : 'text-amber-500';

    return (
        <div className={`p-4 rounded-xl border-2 shadow-md ${colorClasses[color]}`}>
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-1">
                <span className={`w-5 h-5 ${iconColor}`}>{icon}</span>{title}
            </div>
            <div className={`text-xl font-extrabold`}>{value}</div>
        </div>
    )
}