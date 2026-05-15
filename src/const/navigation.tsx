import {
  Home,
  ShoppingBag,
  Search,
  ShoppingCart,
  Menu,
  Grid2X2,
  Phone,
  User,
  Heart,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  href?: string;
  label: string;
  icon: LucideIcon;
  action?: () => void;
  /** Yalnız mobil dockda göstərilsin */
  mobileOnly?: boolean;
  /** Yalnız desktop dockda göstərilsin */
  desktopOnly?: boolean;
  /** Səbət, bəyənmə kimi sayğac üçün */
  badge?: number;
  /** Xarici görünüş fərqi (telefon kimi) */
  variant?: "primary" | "default";
}

// Bütün naviqasiya elementləri bir yerdə
export const MAIN_NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/", label: "Ana Səhifə", icon: Home },
  { key: "products", href: "/products", label: "Məhsullar", icon: ShoppingBag },
  { key: "fresh-today", href: "/fresh-today", label: "Bu Gün Gələnlər", icon: Grid2X2 },
  { key: "chat", href: "/chat", label: "Əlaqə", icon: Heart },
  { key: "baskets", href: "/baskets", label: "Səbətlər", icon: Package },

];

// Mobil dock üçün xüsusi maddələr (MAIN_NAV_ITEMS-dən seçilmiş + əlavələr)
export const MOBILE_DOCK_ITEMS: NavItem[] = [
  { key: "home", href: "/", label: "Ana səhifə", icon: Home },
  { key: "products", href: "/products", label: "Məhsullar", icon: ShoppingBag },
  { key: "fresh-today", href: "/fresh-today", label: "Bu Gün Gələnlər", icon: Grid2X2 },
  { key: "search", label: "Axtarış", icon: Search, action: () => {} },
  { key: "cart", href: "/cart", label: "Səbət", icon: ShoppingCart, badge: 0 },
  { key: "menu", label: "Menyu", icon: Menu, action: () => {} },
];

// Desktop dock (istəyə bağlı – səhifənin alt hissəsində incə nav)
export const DESKTOP_DOCK_ITEMS: NavItem[] = [
  { key: "home", href: "/", label: "Ana Səhifə", icon: Home },
  { key: "products", href: "/products", label: "Bütün Məhsullar", icon: ShoppingBag },
  { key: "fresh-today", href: "/fresh-today", label: "Bu Gün Gələnlər", icon: Grid2X2 },
  { key: "categories", label: "Kateqoriyalar", icon: Grid2X2, action: () => {} },
  { key: "cart", href: "/cart", label: "Səbət", icon: ShoppingCart, badge: 0 },
  { key: "account", href: "/account", label: "Hesabım", icon: User },
];

// Axtarış overlay üçün populyar terminlər
export const POPULAR_SEARCHES = ["Bal", "Tərəvəz", "Meyvə", "Süd məhsulları", "Yumurta"];