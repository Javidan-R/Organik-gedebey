// ===================================================
// REFERAL / MARKETING STRIP – dostunu dəvət et
// ===================================================

import { PartyPopper } from "lucide-react"

export  function ReferralStrip() {
  return (
    <section className="rounded-3xl border border-amber-100 bg-[#fffaf1] px-5 py-4 text-xs text-[#5c4314] shadow-[0_10px_30px_rgba(120,83,10,0.12)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200/70 text-lg">
            <PartyPopper className="h-4 w-4 text-amber-900" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              Dostunu dəvət et – hər ikinizə bonus endirim!
            </p>
            <p className="text-[11px] text-[#7b5a1a]">
              Paylaşacağın sadə mesajla həm dostun, həm sən ilk kənd səbəti sifarişində
              endirim qazana bilərsiniz.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl bg-amber-700 px-4 py-2 text-[11px] font-semibold text-white shadow-md hover:bg-amber-800"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator
                .share({
                  title: 'Organik Gədəbəy',
                  text: 'Kənd məhsulları, meyvə-tərəvəz və təbii dadlar – mən buradan alıram 👇',
                  url: typeof window !== 'undefined' ? window.location.origin : '',
                })
                .catch(() => {})
            }
          }}
        >
          📲 Dostuna göndər
        </button>
      </div>
    </section>
  )
}
