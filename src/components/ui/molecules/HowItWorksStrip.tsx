"use client";

import { motion } from "framer-motion";
import { ShoppingBasket, Truck, CreditCard, CheckCircle2, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { icon: ShoppingBasket, emoji: "🛒", title: "Məhsulu seç", short: "Kataloqdan seç" },
  { icon: Truck, emoji: "🚚", title: "Səbətə at", short: "Miqdarı tənzimlə" },
  { icon: CreditCard, emoji: "💬", title: "WhatsApp ilə tamamla", short: "Sürətli sifariş" },
  { icon: CheckCircle2, emoji: "✅", title: "Zövq al!", short: "Təzə məhsullar" },
];

export function HowItWorksStrip({ onLearnMore }: { onLearnMore?: () => void }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white/98 shadow-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-lime-50/30 pointer-events-none" />
      <div className="relative p-5 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
            >
              <Zap className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-wide">Necə işləyir?</p>
              <p className="text-[11px] text-slate-400">4 sadə addımda sifariş ver</p>
            </div>
          </div>
          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              Ətraflı bax <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-100"
            >
              <span className="text-3xl">{s.emoji}</span>
              <p className="text-xs font-black text-slate-800">{s.title}</p>
              <p className="text-[10px] text-slate-400">{s.short}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-lime-50 border border-emerald-100 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-emerald-800">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Hər sifarişdə 100% zəmanət – məmnun olmassan, pulunu geri al.</span>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
          >
            İndi sifariş ver <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}