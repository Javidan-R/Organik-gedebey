// ===================================================
// STATS STRIP – kənd statistikaları
// ===================================================

export  function StatsStrip({
  totalProducts,
  totalOrders,
  avgRating,
}: {
  totalProducts: number
  totalOrders: number
  avgRating: number
}) {
  const stats = [
    { label: 'Kənd məhsulu', value: `${totalProducts || '50+'}`, icon: '🥕' },
    {
      label: 'Müştəri məmnuniyyəti',
      value: `${avgRating ? avgRating.toFixed(1) : '4.9'} ⭐`,
      icon: '💚',
    },
    { label: 'Gədəbəy təsərrüfatı', value: '12+', icon: '🏡' },
    { label: 'Çatdırılan kənd səbəti', value: `${totalOrders || '300+'}`, icon: '🚚' },
  ]

  return (
    <section className="rounded-3xl border border-lime-100 bg-[#fbfff8]/90 px-4 py-3 shadow-[0_10px_30px_rgba(19,59,19,0.08)] backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4 sm:text-sm">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className={`flex items-center gap-2 sm:justify-center ${
              idx > 0 ? 'sm:border-l sm:border-lime-50' : ''
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-50 text-base sm:h-8 sm:w-8">
              {s.icon}
            </span>
            <div>
              <p className="text-[11px] text-[#6c806c]">{s.label}</p>
              <p className="text-sm font-semibold text-[#203620]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
