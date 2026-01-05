// ===================================================
// HOW IT WORKS STRIP
// ===================================================

import { ShoppingBasket, Truck, CreditCard } from "lucide-react"

export  function HowItWorksStrip() {
  const steps = [
    {
      icon: <ShoppingBasket className="h-4 w-4 text-emerald-700" />,
      title: 'Məhsulu seç',
      text: 'Səhər süfrəsi, çay masası və ya uşaqlar üçün uyğun məhsulları kataloqdan seç.',
    },
    {
      icon: <Truck className="h-4 w-4 text-emerald-700" />,
      title: 'Çatdırılmanı təsdiqlə',
      text: 'Ünvanını və uyğun çatdırılma intervalını qeyd et, göndərişi planlayaq.',
    },
    {
      icon: <CreditCard className="h-4 w-4 text-emerald-700" />,
      title: 'Nağd, kart və ya köçürmə',
      text: 'Qapıda nağd, POS və ya öncədən bank köçürməsi ilə ödəniş edə bilərsən.',
    },
  ]

  return (
    <section className="rounded-[26px] border border-slate-100 bg-white/90 p-5 shadow-sm md:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#3a523c]">
        Necə işləyir?
      </p>
      <div className="mt-3 grid gap-3 text-[11px] text-[#2e4230] md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.title}
            className="flex flex-col gap-1.5 rounded-2xl bg-emerald-50/50 px-3 py-3 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
                {s.icon}
              </div>
              <p className="text-[12px] font-semibold">{s.title}</p>
            </div>
            <p className="text-[11px] text-[#566956]">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
