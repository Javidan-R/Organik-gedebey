'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  MessageSquare,
  Youtube,
  ArrowUp,
  Send,
  CheckCircle,
  X,
  Sparkles,
  Leaf,
  Truck,
  ShieldCheck,
  CreditCard,
  Clock,
  ChevronRight,
  Package,
  Store,
  Headphones,
  Award,
  Heart,
  Globe,
  Coffee,
  Users,
  Zap,
  Waves,
  Mountain,
  TreePine,
  Flower2,
  Droplets,
  Sun,
  Cloud,
  Wind,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import type { Category } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
type SocialLink = {
  icon: React.ElementType;
  href: string;
  label: string;
  color: string;
};

type QuickLink = {
  label: string;
  href: string;
};

type FooterConfig = {
  logoText: string;
  primaryColor: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  aboutText: string;
  copyright: string;
  quickLinks: QuickLink[];
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const socialPresets: SocialLink[] = [
  { icon: Facebook, label: 'Facebook', color: '#1877F2', href: '#' },
  { icon: Instagram, label: 'Instagram', color: '#E4405F', href: '#' },
  { icon: Twitter, label: 'Twitter', color: '#1DA1F2', href: '#' },
  { icon: Youtube, label: 'YouTube', color: '#FF0000', href: '#' },
];

const paymentMethods = [
  { name: 'Visa', icon: CreditCard },
  { name: 'Mastercard', icon: CreditCard },
  { name: 'PayPal', icon: Send },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StoreFooter() {
  const storefrontConfig = useApp((state) => state.storefrontConfig);
  const categories = useApp((state) => state.categories);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.8, 1], [0, 1]);

  // ─── Config ─────────────────────────────────────────────────────────────────
  const config: FooterConfig = {
    logoText: storefrontConfig?.siteTitle || 'Organik Gədəbəy',
    primaryColor: storefrontConfig?.primaryColor || '#22C55E',
    contactPhone: storefrontConfig?.contactPhone || '+994 50 123 45 67',
    contactEmail: storefrontConfig?.contactEmail || 'info@organik.az',
    address: storefrontConfig?.contactAddress || 'Bakı, Azərbaycan',
    aboutText:
      storefrontConfig?.footerAboutText ||
      'Təbiətin əvəzsiz nemətləri bir klik uzağınızda. 100% organik və təzə məhsullar.',
    copyright:
      storefrontConfig?.footerCopyright ||
      `© ${new Date().getFullYear()} Organik Gədəbəy. Bütün hüquqlar qorunur.`,
    quickLinks: storefrontConfig?.footerQuickLinks || [
      { label: 'Ana Səhifə', href: '/' },
      { label: 'Haqqımızda', href: '/about' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Əlaqə', href: '/contact' },
    ],
    socialLinks: {
      facebook: storefrontConfig?.socialFacebook || '#',
      instagram: storefrontConfig?.socialInstagram || '#',
      twitter: storefrontConfig?.socialTwitter || '#',
      youtube: storefrontConfig?.socialYoutube || '#',
    },
  };

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNewsletterSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !email.includes('@')) {
        setToastMessage('Zəhmət olmasa düzgün email daxil edin');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubscribed(true);
        setToastMessage('Abunəliyiniz uğurla tamamlandı! 🌿');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setEmail('');
      } catch (error) {
        setToastMessage('Xəta baş verdi, yenidən cəhd edin');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const primaryStyle = {
    '--primary-color': config.primaryColor,
    '--primary-glow': `${config.primaryColor}33`,
    '--primary-dark': `${config.primaryColor}99`,
  } as React.CSSProperties;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <footer
        ref={footerRef}
        className="relative mt-16 overflow-hidden text-white"
        style={primaryStyle}
      >
        {/* ——— Background with Organic Pattern ——— */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black" />

          {/* Organic wave layers */}
          <div className="absolute bottom-0 left-0 right-0 h-32">
            <svg
              className="absolute bottom-0 w-full h-32 text-emerald-500/5"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                fill="currentColor"
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>

          {/* Floating organic shapes */}
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/3 blur-3xl" />

          {/* Leaf pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L35 20 L45 20 L37 28 L40 38 L30 32 L20 38 L23 28 L15 20 L25 20 Z' fill='${config.primaryColor.replace('#', '%23')}'/%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        {/* ——— Content ——— */}
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* ——— Üst hissə: Logo + Abunəlik ——— */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-10 border-b border-white/5">
            {/* Logo & About - 2 sütun */}
            <div className="lg:col-span-2 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                viewport={{ once: true }}
              >
                <Link href="/" className="group inline-flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <span
                    className="text-2xl font-extrabold tracking-tight transition-colors duration-300 group-hover:text-[color:var(--primary-color)]"
                    style={{ color: config.primaryColor }}
                  >
                    {config.logoText}
                  </span>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-gray-400 text-sm max-w-md leading-relaxed"
              >
                {config.aboutText}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-wrap gap-3 pt-1"
              >
                {socialPresets.map((social, idx) => {
                  const href =
                    social.label === 'Facebook'
                      ? config.socialLinks.facebook
                      : social.label === 'Instagram'
                      ? config.socialLinks.instagram
                      : social.label === 'Twitter'
                      ? config.socialLinks.twitter
                      : config.socialLinks.youtube;
                  return (
                    <motion.a
                      key={social.label}
                      href={href || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300"
                      style={
                        {
                          '--social-color': social.color,
                        } as React.CSSProperties
                      }
                    >
                      <social.icon className="w-4.5 h-4.5 text-gray-400 group-hover:text-[var(--social-color)] transition-colors duration-300" />
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.a>
                  );
                })}
              </motion.div>
            </div>

            {/* Newsletter - 3 sütun */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="lg:col-span-3 lg:pl-8"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/10 p-6 shadow-2xl shadow-black/20">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Xəbər bülleteni</h4>
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400">
                      Yeni
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 max-w-lg">
                    Xüsusi təkliflərdən, yeni məhsullardan və endirimlərdən ilk siz xəbərdar olun.
                  </p>

                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email ünvanınız"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-color)]/50 focus:border-transparent transition-all duration-300"
                        disabled={isSubscribed}
                      />
                      {isSubscribed && (
                        <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <motion.button
                      type="submit"
                      disabled={isLoading || isSubscribed}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isSubscribed ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Abunə oldunuz
                        </>
                      ) : (
                        <>
                          Abunə ol
                          <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                    Spam yoxdur, istədiyiniz vaxt imtina edə bilərsiniz
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ——— Link qrupları (6 sütun) ——— */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 py-10 border-b border-white/5">
            {/* Sürətli keçidlər */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-emerald-400" />
                Sürətli
              </h4>
              <ul className="space-y-2 text-sm">
                {config.quickLinks.map((link, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href={link.href}
                      className="group flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-500/50 group-hover:text-emerald-400 transition-colors duration-200" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.label}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

    
            {/* Xidmətlər */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-emerald-400" />
                Xidmətlər
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Çatdırılma', icon: Truck },
                  { label: 'Zəmanət', icon: ShieldCheck },
                  { label: 'Geri qaytarma', icon: Package },
                  { label: 'Dəstək', icon: Headphones },
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href="#"
                      className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 transition-colors duration-200" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {item.label}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Təbiət elementləri */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-emerald-400" />
                Təbiət
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Organik sertifikat', icon: Award },
                  { label: 'Davamlılıq', icon: Leaf },
                  { label: 'Ekoloji qablaşdırma', icon: Package },
                  { label: 'Karbon izi', icon: Cloud },
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <span className="flex items-center gap-2 text-gray-400">
                      <item.icon className="w-3.5 h-3.5 text-emerald-500/70" />
                      {item.label}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Statistikalar - 2 sütun */}
            <div className="col-span-2 lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-emerald-400" />
                Niyə biz?
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Leaf, label: '100% Organik', desc: 'Təbii məhsullar' },
                  { icon: Clock, label: 'Sürətli çatdırılma', desc: '24 saat ərzində' },
                  { icon: Award, label: 'Yüksək keyfiyyət', desc: 'Seçilmiş məhsullar' },
                  { icon: Users, label: 'Məmnun müştəri', desc: '5000+ müştəri' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors duration-300">
                      <item.icon className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ——— Əlaqə məlumatları ——— */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-white/5">
            {[
              {
                icon: Phone,
                label: 'Telefon',
                value: config.contactPhone,
                link: `tel:${config.contactPhone.replace(/\s/g, '')}`,
              },
              {
                icon: Mail,
                label: 'Email',
                value: config.contactEmail,
                link: `mailto:${config.contactEmail}`,
              },
              {
                icon: MapPin,
                label: 'Ünvan',
                value: config.address,
                link: undefined,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
                  {item.link ? (
                    <a
                      href={item.link}
                      className="text-sm text-gray-300 hover:text-white transition-colors duration-200 truncate block"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-300 truncate block">{item.value}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ——— Bottom Bar ——— */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 text-sm text-gray-500"
          >
            <p className="text-center md:text-left">{config.copyright}</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-gray-300 transition-colors duration-200">
                İstifadə şərtləri
              </Link>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors duration-200">
                Məxfilik siyasəti
              </Link>
              <Link href="/cookies" className="hover:text-gray-300 transition-colors duration-200">
                Çərəzlər
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-600">Ödəniş</span>
              {paymentMethods.map((method, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-md bg-white/5 border border-white/5"
                  title={method.name}
                >
                  <method.icon className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ——— Back to Top ——— */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="fixed bottom-24 right-6 z-50 p-3 rounded-full shadow-2xl shadow-emerald-500/30 transition-all duration-300"
              style={{ backgroundColor: config.primaryColor }}
            >
              <ArrowUp className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ——— WhatsApp ——— */}
        <motion.a
          href={`https://wa.me/${config.contactPhone.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl shadow-emerald-500/30 transition-all duration-300"
          style={{ backgroundColor: config.primaryColor }}
        >
          <MessageSquare className="w-7 h-7 text-white" />
        </motion.a>

        {/* ——— Toast ——— */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-gray-900 border border-white/10 shadow-2xl flex items-center gap-3 text-sm text-white backdrop-blur-xl"
            >
              {toastMessage.includes('🌿') ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
              <span>{toastMessage.replace(/[🌿✅🎉]/g, '').trim()}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {/* ——— Global Styles ——— */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        ::selection {
          background: ${config.primaryColor}40;
          color: white;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: ${config.primaryColor}66 transparent;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${config.primaryColor}66;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}