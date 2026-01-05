

// ===================================================
// WHATSAPP CTA
// ===================================================

import { motion } from "framer-motion";
import { Link } from "lucide-react";

export function WhatsAppCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-[28px] border border-emerald-100 bg-linear-to-br from-[#e4fbea] via-white to-[#dff5e4] px-6 py-7 text-center shadow-[0_16px_50px_rgba(17,94,50,0.25)]"
    >
      <h3 className="text-xl font-extrabold text-[#154226] sm:text-2xl">
        WhatsApp ilə bir mesajda sifariş et
      </h3>
      <p className="mt-1 text-sm text-[#426347]">
        Məhsulları səbətə əlavə et və bir kliklə WhatsApp-dan davam et. Hər addımda kömək
        edərik.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/cart"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f7a32] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#145323]"
        >
          🛒 Səbətə keç
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1c4a24] shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-50"
        >
          💬 Chat ilə soruş
        </Link>
      </div>
    </motion.section>
  )
}
