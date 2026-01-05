// ===================================================
// MOBILE BOTTOM BAR
// ===================================================

import Link from "next/link";

export function MobileBottomBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-3 pl-3 pr-3 sm:hidden">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-[#17321d] px-3 py-2 text-xs text-white shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/90 text-lg">
            🥬
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
              Organik Gədəbəy
            </span>
            <span className="text-[11px] text-emerald-50">
              Bir kliklə səbətə və ya WhatsApp-a keç
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/cart"
            className="inline-flex h-8 items-center justify-center rounded-full bg-emerald-400 px-3 text-[11px] font-semibold text-[#103017]"
          >
            Səbət
          </Link>
          <Link
            href="/chat"
            className="inline-flex h-8 items-center justify-center rounded-full bg-white px-3 text-[11px] font-semibold text-[#14321b]"
          >
            Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
