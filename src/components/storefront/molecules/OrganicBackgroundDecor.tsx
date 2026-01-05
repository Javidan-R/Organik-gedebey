// ===================================================
// ORGANIC BACKGROUND DECOR – kənd aurası
// ===================================================

export  function OrganicBackgroundDecor() {
  return (
    <>
      {/* Yumşaq rural dumanlar */}
      <div className="pointer-events-none fixed -left-32 -top-32 z-0 h-64 w-64 rounded-full bg-lime-200/50 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 top-40 z-0 h-52 w-52 rounded-full bg-amber-200/60 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-120px] left-1/2 z-0 h-72 w-[520px] -translate-x-1/2 rounded-[260px] bg-linear-to-r from-lime-200/40 via-amber-100/60 to-emerald-200/50 blur-3xl" />
      {/* Zəif taxta teksturası overlay üçün */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/textures/paper-grain.png')] opacity-[0.08] mix-blend-soft-light" />
    </>
  )
}