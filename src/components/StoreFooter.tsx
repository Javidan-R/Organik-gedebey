// 'use client' - Tələb olunmur, çünki bu statik komponentdir

import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, MessageSquare } from 'lucide-react'

// --- MOCK Data Yenidən İstifadəsi ---
// Header komponentindəki eyni MOCK datadan istifadə edilir.
interface StorefrontConfig {
    logoText: string;
    primaryColor: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
}
interface Category { id: string; name: string; slug: string; }

const mockCategories: Category[] = [
  { id: '1', name: 'Meyvələr', slug: 'meyveler' },
  { id: '2', name: 'Tərəvəzlər', slug: 'terevezler' },
]

const mockStorefrontConfig: StorefrontConfig = {
    logoText: 'Organik Gədəbəy',
    primaryColor: '#22C55E', // Tailwind green-500
    contactPhone: '+994 50 123 45 67',
    contactEmail: 'info@organik.az',
    address: 'Bakı, Azərbaycan',
}

const useStoreData = () => ({
    categories: mockCategories,
    config: mockStorefrontConfig,
})
// ------------------------------------

export default function StoreFooter() {
    const { categories, config } = useStoreData()

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
                            Təbiətin əvəzsiz nemətləri bir klik uzağınızda. 100% organik və təzə məhsullar.
                        </p>
                        
                        {/* Social Media Links */}
                        <div className="flex space-x-4 pt-2">
                            <SocialIcon icon={Facebook} href="https://facebook.com" />
                            <SocialIcon icon={Instagram} href="https://instagram.com" />
                            <SocialIcon icon={Twitter} href="https://twitter.com" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-bold text-gray-300">Sürətli Keçidlər</h4>
                        <ul className="space-y-2 text-sm">
                            <FooterLink href="/" label="Ana Səhifə" />
                            <FooterLink href="/about" label="Haqqımızda" />
                            <FooterLink href="/faq" label="FAQ" />
                            <FooterLink href="/sitemap" label="Sayt Xəritəsi" />
                        </ul>
                    </div>

                    {/* Categories (Admin-dən gələn) */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-bold text-gray-300">Məhsul Kateqoriyaları</h4>
                        <ul className="space-y-2 text-sm">
                            {categories.map(cat => (
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
                    <p>&copy; {new Date().getFullYear()} {config.logoText}. Bütün hüquqlar qorunur.</p>
                    <div className="flex space-x-4 mt-2 md:mt-0">
                        <Link href="/terms" className="hover:text-gray-200">İstifadə Şərtləri</Link>
                        <Link href="/privacy" className="hover:text-gray-200">Məxfilik Siyasəti</Link>
                    </div>
                </div>
            </div>
            
            {/* WhatsApp/Live Chat Button */}
            <Link 
                href={`https://wa.me/${config.contactPhone.replace(/\s/g, '')}`} 
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