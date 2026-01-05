// ===================================================
// TESTIMONIAL STRIP
// ===================================================

export  function TestimonialStrip() {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white/90 px-5 py-6 shadow-[0_12px_35px_rgba(10,52,23,0.12)] backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Müştəri rəyi
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-[#2d4b2f]">
            “Balın dadı tam uşaqlıqda içdiyimiz kimi idi. Qatığın turşuluğu da super idi,
            heç bir supermarket məhsuluna bənzəmir. Çatdırılma da çox tez oldu.”
          </p>
          <p className="text-xs font-semibold text-[#566d56]">— Aysel, Gəncə</p>
        </div>

        <div className="flex flex-col items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-[#184228]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            Niyə bizi seçirlər?
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <span>🌿</span>
              <span>Əsl kənd məhsulu dadı</span>
            </li>
            <li className="flex items-center gap-2">
              <span>🚚</span>
              <span>Gəncə daxili sürətli çatdırılma</span>
            </li>
            <li className="flex items-center gap-2">
              <span>💬</span>
              <span>WhatsApp üzərindən rahat sifariş</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
