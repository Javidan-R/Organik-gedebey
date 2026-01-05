
// ===================================================
// STORY STRIP – kənd hekayəsi
// ===================================================

export  function StoryStrip() {
  return (
    <section className="grid gap-5 rounded-[28px] border border-amber-100 bg-linear-to-br from-[#fff8e7] via-[#fffdf6] to-[#fdf0d0] p-5 shadow-[0_14px_40px_rgba(120,83,10,0.16)] md:grid-cols-[1.6fr,1.1fr] md:p-7">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900">
          🌾 Hekayəmiz
        </div>
        <h2 className="text-xl font-extrabold text-[#4a3612] sm:text-2xl">
          Hər məhsulun arxasında bir kənd həyəti var
        </h2>
        <p className="text-xs leading-relaxed text-[#6b5330] sm:text-sm">
          Organik Gədəbəy, uzun illərdir bal, pendir, südlü məhsullar və təbii tərəvəz
          yetişdirən kiçik ailə təsərrüfatları ilə birgə çalışır. Məqsədimiz – kənd
          həyətindəki təmiz dadı olduğu kimi, heç bir “şəhər qatqısı” olmadan evinizə
          çatdırmaqdır.
        </p>
        <ul className="grid gap-2 text-xs text-[#5b4828] sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span>✅</span>
            <span>Kənddən şəhərə “nəfəs alan” təbii məhsullar</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✅</span>
            <span>Əlçatan qiymət – kəndlini də, müştərini də düşünərək</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✅</span>
            <span>Çatdırılmada soyudulmuş zənciri maksimum qorumağa çalışırıq</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✅</span>
            <span>Bal, pendir, qatıq – hamısı qoruyucu qatqısız</span>
          </li>
        </ul>
      </div>

      <div className="relative h-[170px] sm:h-[200px] md:h-full">
        <div className="absolute inset-0 rounded-[26px] bg-[url('/village-1.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 rounded-[26px] bg-linear-to-t from-black/25 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-2xl bg-black/40 px-3 py-2 text-[11px] text-white backdrop-blur">
          <span>“Nənəmin hazırladığı kimi dad”</span>
          <span className="hidden text-xs font-semibold md:inline">
            — Müştəri rəyləri
          </span>
        </div>
      </div>
    </section>
  )
}
