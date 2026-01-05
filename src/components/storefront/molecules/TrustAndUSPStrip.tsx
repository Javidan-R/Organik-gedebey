// ===================================================
// TRUST & USP STRIP – niyə biz?
// ===================================================

import { Milk, ThermometerSun, CircleDollarSign, HandHeart } from "lucide-react"

export  function TrustAndUSPStrip() {
  const items = [
    {
      icon: <Milk className="h-4 w-4 text-emerald-700" />,
      title: 'Qatqısız süd məhsulları',
      text: 'Qaymaq, qatıq, pendir – supermarket zəncirlərindən fərqli olaraq, qoruyucu qatqısız və “ev dadı”nda.',
    },
    {
      icon: <ThermometerSun className="h-4 w-4 text-amber-600" />,
      title: 'Soyuducu zəncirinə nəzarət',
      text: 'İstilik həssas məhsullar üçün xüsusi termobokslar istifadə edirik, marşrutlar qısa planlanır.',
    },
    {
      icon: <CircleDollarSign className="h-4 w-4 text-emerald-700" />,
      title: 'Kəndli üçün ədalətli qiymət',
      text: 'Aradakı vasitəçiləri minimuma endirib həm kəndliyə, həm müştəriyə ədalətli qiymət saxlayırıq.',
    },
    {
      icon: <HandHeart className="h-4 w-4 text-rose-600" />,
      title: 'Qazi & şəhid ailələrinə dəstək',
      text: 'Qazi və şəhid ailələri üçün xüsusi endirim və üstünlük siyasətimiz mövcuddur.',
    },
  ]

  return (
    <section className="grid gap-4 rounded-[28px] border border-emerald-100 bg-linear-to-br from-[#ecfff1] via-white to-[#e4f9ec] p-5 shadow-[0_14px_40px_rgba(15,84,39,0.16)] md:grid-cols-4 md:p-6">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col gap-2 rounded-2xl bg-white/80 px-3 py-3 text-[11px] text-[#2c4730] shadow-sm ring-1 ring-emerald-50"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
              {item.icon}
            </div>
            <p className="text-[12px] font-semibold">{item.title}</p>
          </div>
          <p className="text-[11px] text-[#516550]">{item.text}</p>
        </div>
      ))}
    </section>
  )
}
