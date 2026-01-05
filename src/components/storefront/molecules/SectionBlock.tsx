
// ===================================================
// SECTION HEADER + WRAPPER
// ===================================================

import Link from "next/link"

type SectionBlockProps = {
  id?: string
  title: string
  subtitle?: string
  href?: string
  badge?: string
  children: React.ReactNode
}

export  function SectionBlock({ id, title, subtitle, href, badge, children }: SectionBlockProps) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#163319] sm:text-2xl md:text-[1.7rem]">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#566b57] sm:text-sm">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1e5f27] shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
          >
            Hamısına bax
            <span>→</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
