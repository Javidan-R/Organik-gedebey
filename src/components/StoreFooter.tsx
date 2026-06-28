'use client';

import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, MessageSquare, Youtube } from 'lucide-react'
import { useApp } from '@/lib/store';
import type { Category } from '@/lib/types';

export default function StoreFooter() {
    const storefrontConfig = useApp((state) => state.storefrontConfig);
    const categories = useApp((state) => state.categories);

    const config = {
        logoText: storefrontConfig?.siteTitle || 'Organik Gədəbəy',
        primaryColor: storefrontConfig?.primaryColor || '#22C55E',
        contactPhone: storefrontConfig?.contactPhone || '+994 50 123 45 67',
        contactEmail: storefrontConfig?.contactEmail || 'info@organik.az',
        address: storefrontConfig?.contactAddress || 'Bakı, Azərbaycan',
        aboutText: storefrontConfig?.footerAboutText || 'Təbiətin əvəzsiz nemətləri bir klik uzağınızda. 100% organik və təzə məhsullar.',
        copyright: storefrontConfig?.footerCopyright || `© ${new Date().getFullYear()} Organik Gədəbəy. Bütün hüquqlar qorunur.`,
        quickLinks: storefrontConfig?.footerQuickLinks || [
            { label: 'Ana Səhifə', href: '/' },
            { label: 'Haqqımızda', href: '/about' },
            { label: 'FAQ', href: '/faq' },
        ],
        socialLinks: {
            facebook: storefrontConfig?.socialFacebook || 'https://facebook.com',
            instagram: storefrontConfig?.socialInstagram || 'https://instagram.com',
            twitter: storefrontConfig?.socialTwitter || 'https://twitter.com',
            youtube: storefrontConfig?.socialYoutube || 'https://youtube.com',
        },
    };

    const primaryStyle = {
        '--primary-color': config.primaryColor,
    } as React.CSSProperties

    const twPrimary = `text-[color:var(--primary-color)] hover:text-white`
    const twPrimaryBg = `hover:bg-[color:var(--primary-color)]`

    return (
        <footer
            className="bg-gray-800 text-white mt-12 pt-10"
            style={primaryStyle}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-gray-700 pb-10">

                    {/* Logo & About */}
                    <div className="col-span-2 md:col-span-2 space-y-4">
                        <Link href="/" className="text-3xl font-extrabold tracking-tight" style={{ color: config.primaryColor }}>
                            {config.logoText}
                        </Link>
                        <p className="text-gray-400 text-sm max-w-sm">
                            {config.aboutText}
                        </p>

                        {/* Social Media Links */}
                        <div className="flex space-x-4 pt-2">
                            {config.socialLinks.facebook && <SocialIcon icon={Facebook} href={config.socialLinks.facebook} />}
                            {config.socialLinks.instagram && <SocialIcon icon={Instagram} href={config.socialLinks.instagram} />}
                            {config.socialLinks.twitter && <SocialIcon icon={Twitter} href={config.socialLinks.twitter} />}
                            {config.socialLinks.youtube && <SocialIcon icon={Youtube} href={config.socialLinks.youtube} />}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-bold text-gray-300">Sürətli Keçidlər</h4>
                        <ul className="space-y-2 text-sm">
                            {config.quickLinks.map((link, index) => (
                                <FooterLink key={index} href={link.href} label={link.label} />
                            ))}
                        </ul>
                    </div>

                    {/* Categories (Admin-dən gələn) */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-bold text-gray-300">Məhsul Kateqoriyaları</h4>
                        <ul className="space-y-2 text-sm">
                            {categories.slice(0, 5).map(cat => (
                                <FooterLink key={cat.id} href={`/category/${cat.slug}`} label={cat.name} />
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info (Admin-dən gələn) */}
                    <div className="space-y-3 col-span-2 md:col-span-1">
                        <h4 className="text-lg font-bold text-gray-300">Əlaqə</h4>
                        <ul className="space-y-3 text-sm">
                            <ContactItem icon={Phone} text={config.contactPhone} link={`tel:${config.contactPhone.replace(/\s/g, '')}`} />
                            <ContactItem icon={Mail} text={config.contactEmail} link={`mailto:${config.contactEmail}`} />
                            <ContactItem icon={MapPin} text={config.address} />
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center py-4 text-sm text-gray-400">
                    <p>{config.copyright}</p>
                    <div className="flex space-x-4 mt-2 md:mt-0">
                        <Link href="/terms" className="hover:text-gray-200">İstifadə Şərtləri</Link>
                        <Link href="/privacy" className="hover:text-gray-200">Məxfilik Siyasəti</Link>
                    </div>
                </div>
            </div>

            {/* WhatsApp/Live Chat Button */}
            <Link
                href={`https://wa.me/${config.contactPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition duration-300 ease-in-out ${twPrimaryBg}`}
                style={{ backgroundColor: config.primaryColor }}
            >
                <MessageSquare className="w-7 h-7 text-white" />
            </Link>
        </footer>
    )
}

// Helper Components
const FooterLink = ({ href, label }: { href: string, label: string }) => (
    <li>
        <Link
            href={href}
            className="text-gray-400 hover:text-[color:var(--primary-color)] transition duration-200"
        >
            {label}
        </Link>
    </li>
)

const ContactItem = ({ icon: Icon, text, link }: { icon: any, text: string, link?: string }) => (
    <li className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        {link ? (
            <a href={link} className="text-gray-400 hover:text-[color:var(--primary-color)] transition">
                {text}
            </a>
        ) : (
            <span className="text-gray-400">{text}</span>
        )}
    </li>
)

const SocialIcon = ({ icon: Icon, href }: { icon: any, href: string }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-gray-700 hover:bg-[color:var(--primary-color)] transition duration-300"
    >
        <Icon className="w-5 h-5 text-white" />
    </a>
)