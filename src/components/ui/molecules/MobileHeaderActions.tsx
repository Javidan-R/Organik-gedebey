"use client";
import { motion } from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";
import type { StorefrontConfig } from "@/lib/types";

type MobileActionsProps = {
  config: StorefrontConfig & { contactPhone: string };
};

export function MobileHeaderActions({ config }: MobileActionsProps) {
  const phone = config.contactPhone || "+994775878588";
  const whatsappNumber = phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  const ring = {
    initial: { scale: 1, opacity: 0.6 },
    animate: {
      scale: 1.8,
      opacity: 0,
      transition: { repeat: Infinity, duration: 1.8, ease: "easeOut" as const },
    },
  }; 

  return (
    <div className="flex items-center gap-1.5">
      {/* WhatsApp */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100"
      >
        <motion.span
          variants={ring}
          initial="initial"
          animate="animate"
          className="absolute inset-0 rounded-full bg-green-400"
        />
        <MessageCircle className="relative z-10 h-5 w-5" />
      </motion.a>

      {/* Telefon */}
      <motion.a
        href={`tel:${phone}`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
      >
        <motion.span
          variants={ring}
          initial="initial"
          animate="animate"
          className="absolute inset-0 rounded-full bg-emerald-400"
        />
        <Phone className="relative z-10 h-5 w-5" />
      </motion.a>
    </div>
  );
}