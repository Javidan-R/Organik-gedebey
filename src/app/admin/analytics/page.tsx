"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/lib/store"
import { Loader2 } from "lucide-react"

// ——— Recharts dinamik import (SSR üçün təhlükəsiz) ———
const ResponsiveContainer = dynamic(async () => ({ default: (await import("recharts")).ResponsiveContainer }), { ssr: false });
const BarChart = dynamic(async () => ({ default: (await import("recharts")).BarChart }), { ssr: false });
const Bar = dynamic(async () => ({ default: (await import("recharts")).Bar }), { ssr: false });
const XAxis = dynamic(async () => ({ default: (await import("recharts")).XAxis }), { ssr: false });
const YAxis = dynamic(async () => ({ default: (await import("recharts")).YAxis }), { ssr: false });
const Tooltip = dynamic(async () => ({ default: (await import("recharts")).Tooltip }), { ssr: false });
const CartesianGrid = dynamic(async () => ({ default: (await import("recharts")).CartesianGrid }), { ssr: false });
const PieChart = dynamic(async () => ({ default: (await import("recharts")).PieChart }), { ssr: false });
const Pie = dynamic(async () => ({ default: (await import("recharts")).Pie }), { ssr: false });
const Cell = dynamic(async () => ({ default: (await import("recharts")).Cell }), { ssr: false });

// —————————————————————————————————————————————————————————
// 🧾 Dashboard — Aylıq Gəlir + Regional Satış Analitikası
// —————————————————————————————————————————————————————————
export default function AnalyticsPage() {
  const { orders, products } = useApp()
  const [liveKpis, setLiveKpis] = useState<{
    monthRevenue: number
    monthOrders: number
    todayRevenue: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics/dashboard', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.kpis) {
          setLiveKpis({
            monthRevenue: data.kpis.monthRevenue,
            monthOrders: data.kpis.monthOrders,
            todayRevenue: data.kpis.todayRevenue,
          })
        }
      })
      .catch(() => {})
  }, [])

  // Günü əsas götürərək sifarişlərin qruplaşdırılması

  // Aylıq gəlir strukturunun hazırlanması
  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      const key = o.createdAt.slice(0, 7) // YYYY-MM
      const total = o.items.reduce((s, it) => s + it.priceAtOrder * it.qty, 0)
      map.set(key, (map.get(key) ?? 0) + total)
    }
    return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }))
  }, [orders])

  // Region üzrə satış payı
  const regionSales = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      for (const it of o.items) {
        const prod = products.find(p => p.id === it.productId)
        if (!prod?.originRegion) continue
        map.set(prod.originRegion, (map.get(prod.originRegion) ?? 0) + it.qty)
      }
    }
    return Array.from(map.entries()).map(([region, qty]) => ({ region, qty }))
  }, [orders, products])

  // Əlavə metriklər
  const totalRevenue = monthlyRevenue.reduce((s, x) => s + x.revenue, 0)
  const avgRevenue = totalRevenue / (orders.length || 1)
  const growthRate = (() => {
    if (monthlyRevenue.length < 2) return 0
    const last = monthlyRevenue[monthlyRevenue.length - 1].revenue
    const prev = monthlyRevenue[monthlyRevenue.length - 2].revenue
    return +(((last - prev) / Math.max(prev, 1)) * 100).toFixed(1)
  })()
  const bestMonth = monthlyRevenue.reduce((a, b) => (b.revenue > a.revenue ? b : a), { month: "-", revenue: 0 })
  const worstMonth = monthlyRevenue.reduce((a, b) => (b.revenue < a.revenue ? b : a), { month: "-", revenue: Infinity })

  // Region üzrə sıralama
  const sortedRegions = [...regionSales].sort((a, b) => b.qty - a.qty)

  return (
    <main className="container mx-auto px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-green-800">📊 Genişləndirilmiş Analitika Paneli</h1>

      {liveKpis ? (
        <div className="grid md:grid-cols-3 gap-4">
          <MetricCard title="Bu gün (DB)" value={`${liveKpis.todayRevenue.toFixed(2)} ₼`} color="emerald" />
          <MetricCard title="Bu ay gəlir (DB)" value={`${liveKpis.monthRevenue.toFixed(2)} ₼`} color="blue" />
          <MetricCard title="Bu ay sifariş (DB)" value={String(liveKpis.monthOrders)} color="amber" />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Canlı KPI yüklənir...
        </div>
      )}

      {/* Ümumi Metriklər */}
      <div className="grid md:grid-cols-5 gap-4 text-center">
        <MetricCard title="Ümumi gəlir" value={`${totalRevenue.toFixed(2)} ₼`} color="emerald" />
        <MetricCard title="Orta sifariş gəliri" value={`${avgRevenue.toFixed(2)} ₼`} color="blue" />
        <MetricCard title="Aylıq artım" value={`${growthRate}%`} color={growthRate >= 0 ? "green" : "red"} />
        <MetricCard title="Ən gəlirli ay" value={bestMonth.month} color="amber" />
        <MetricCard title="Ən zəif ay" value={worstMonth.month} color="gray" />
      </div>

      {/* Aylıq gəlir Bar Chart */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-emerald-700">📅 Aylıq gəlir (Monthly Revenue)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#10b981" name="Gəlir (₼)" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Region üzrə satış Pie Chart */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-emerald-700">🌍 Regionlara görə satış payı</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={regionSales} dataKey="qty" nameKey="region" outerRadius={120} label>
              {regionSales.map((_, i) => (
                <Cell key={i} fill={["#34d399", "#10b981", "#6ee7b7", "#fbbf24", "#f59e0b"][i % 5]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Region üzrə satış cədvəli */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-emerald-700">📈 Regionlara görə satış sıralaması</h2>
        <table className="w-full text-sm">
          <thead className="border-b font-semibold">
            <tr>
              <th className="py-2 text-left">Region</th>
              <th className="text-right">Satılan məhsul sayı</th>
              <th className="text-right">Faiz (%)</th>
            </tr>
          </thead>
          <tbody>
            {sortedRegions.map((r, i) => {
              const percent = ((r.qty / (sortedRegions.reduce((s, x) => s + x.qty, 0))) * 100).toFixed(1)
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{r.region}</td>
                  <td className="text-right">{r.qty}</td>
                  <td className="text-right text-emerald-700 font-semibold">{percent}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function MetricCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl shadow p-4 bg-${color}-50 border border-${color}-100`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
    </div>
  )
}
