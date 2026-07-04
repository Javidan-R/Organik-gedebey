"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NavItem } from "@/const/navigation";

type DockNavProps = {
  items: NavItem[];
  /** Mobil görünüş (altda sərt dock) */
  variant: "mobile" | "desktop";
  /** Səbət sayğacı kimi dinamik badge dəyərləri */
  badgeMap?: Record<string, number>;
  /** Axtarış, menyu kimi action'lar */
  onAction?: (key: string) => void;
  className?: string;
};
 
export function DockNav({
  items,
  variant,
  badgeMap = {},
  onAction,
  className = "",
}: DockNavProps) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav
      className={`flex items-center ${
        isMobile
          ? "justify-around px-1 py-2 pb-[env(safe-area-inset-bottom,8px)] bg-white/90 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
          : "justify-center gap-8 px-6 py-2 bg-white/80 backdrop-blur-md border-b border-gray-100"
      } ${className}`}
    >
      {items.map((item) => {
        const isActive = item.href ? pathname === item.href : false;
        const badge = badgeMap[item.key] ?? item.badge ?? 0;
        const Icon = item.icon;

        const content = (
          <div
            className={`relative flex ${
              isMobile ? "flex-col items-center gap-0.5 px-3 py-1" : "items-center gap-2 px-3 py-1.5"
            } rounded-xl transition-colors ${
              isActive
                ? "text-emerald-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="relative">
              <Icon
                className={`${
                  isMobile ? "w-5 h-5" : "w-4 h-4"
                } transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute ${
                    isMobile ? "-top-1.5 -right-2" : "-top-2 -right-3"
                  } bg-red-500 text-white ${
                    isMobile
                      ? "text-[9px] min-w-[16px] h-4 px-0.5"
                      : "text-[10px] min-w-[18px] h-5 px-1"
                  } font-bold rounded-full flex items-center justify-center border border-white`}
                >
                  {badge > 99 ? "99+" : badge}
                </motion.span>
              )}
            </div>
            <span
              className={`${
                isMobile ? "text-[10px] font-semibold leading-none" : "text-sm font-medium"
              }`}
            >
              {item.label}
            </span>
            {isActive && !isMobile && (
              <motion.div
                layoutId="dock-desktop-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
              />
            )}
            {isActive && isMobile && (
              <motion.div
                layoutId="dock-mobile-indicator"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500"
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
              />
            )}
          </div>
        );

        if (item.action && onAction) {
          return (
            <motion.button
              key={item.key}
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => onAction(item.key)}
              className="flex-1 flex justify-center"
            >
              {content}
            </motion.button>
          );
        }

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex-1 flex justify-center"
              onClick={() => {
                if (isActive) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <motion.div whileTap={{ scale: 0.88 }}>{content}</motion.div>
            </Link>
          );
        }

        return (
          <div key={item.key} className="flex-1 flex justify-center">
            {content}
          </div>
        );
      })}
    </nav>
  );
}