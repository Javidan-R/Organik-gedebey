'use client';

import { useApp } from '@/lib/store';
import Link from 'next/link';

export const Footer = () => {
  const storefrontConfig = useApp((state) => state.storefrontConfig);

  return (
    <footer className="mt-10 border-t bg-white">
      <div className="container-page py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Haqqımızda</h3>
            <p className="text-sm text-gray-600">
              {storefrontConfig?.footerAboutText || 'Təbii kənd məhsulları'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Keçidlər</h3>
            <ul className="space-y-2">
              {storefrontConfig?.footerQuickLinks?.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-emerald-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Sosial Media</h3>
            <div className="flex gap-4">
              {storefrontConfig?.socialInstagram && (
                <a href={storefrontConfig.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-emerald-600">
                  Instagram
                </a>
              )}
              {storefrontConfig?.socialFacebook && (
                <a href={storefrontConfig.socialFacebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-emerald-600">
                  Facebook
                </a>
              )}
              {storefrontConfig?.socialWhatsapp && (
                <a href={`https://wa.me/${storefrontConfig.socialWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-emerald-600">
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          {storefrontConfig?.footerCopyright || `© ${new Date().getFullYear()} Organik Gədəbəy`}
        </div>
      </div>
    </footer>
  );
};