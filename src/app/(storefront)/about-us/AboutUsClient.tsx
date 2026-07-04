// src/app/(storefront)/about-us/AboutUsClient.tsx (düzəlişlər: iconMap tipi, boşluqlar)
'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import {
  Sparkles, Leaf, Award, Heart, ChevronRight,
  MapPin, Users, TrendingUp, Shield, Zap, ArrowRight, Globe
} from 'lucide-react';
import type { Section, Region, Stat } from './page';

function EmptyState({ message = 'Hələ məlumat yoxdur' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Leaf className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-500 text-lg">{message}</p>
    </div>
  );
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Users, Globe, Award, Zap, Leaf, Heart, Shield, TrendingUp,
};

export function AboutUsClient({
  sections,
  regions,
  stats,
}: {
  sections: Section[];
  regions: Region[];
  stats: Stat[];
}) {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.8]);
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);

  const heroSection = sections.find((s) => s.sectionType === 'hero');
  const storySection = sections.find((s) => s.sectionType === 'story');
  const valuesSection = sections.find((s) => s.sectionType === 'values');
  const ctaSection = sections.find((s) => s.sectionType === 'cta');

  const [winSize, setWinSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const handleResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50/30 overflow-x-hidden">
      {/* Hero */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800">
          <div className="absolute inset-0 bg-black/30" />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              initial={{ x: Math.random() * winSize.w, y: Math.random() * winSize.h }}
              animate={{ y: [0, -100, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full mb-8 border border-white/30"
            >
              <Leaf className="w-12 h-12 text-white" />
            </motion.div>
            {heroSection ? (
              <>
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                  {heroSection.title}
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-300">
                    {heroSection.subtitle}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                  {heroSection.description}
                </p>
              </>
            ) : (
              <EmptyState message="Hero bölməsi yüklənmədi" />
            )}
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">Aşağı sürüşdürün</span>
            <ChevronRight className="w-6 h-6 rotate-90" />
          </div>
        </motion.div>
      </motion.section>

      {/* Stats */}
      {stats.length > 0 ? (
        <section className="py-20 px-4 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 via-transparent to-amber-50/50" />
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => {
                const Icon = iconMap[stat.icon || 'Sparkles'] || Sparkles;
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center group"
                  >
                    <motion.div whileHover={{ y: -5 }} className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <motion.h3
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: 'spring' }}
                      className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-2"
                    >
                      {stat.value}
                    </motion.h3>
                    <p className="text-lg font-semibold text-emerald-700 mb-1">{stat.label}</p>
                    {stat.description && <p className="text-sm text-gray-500">{stat.description}</p>}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      ) : (
        <EmptyState message="Statistikalar yüklənmədi" />
      )}

      {/* Story */}
      {storySection ? (
        <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-emerald-50/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
                    <Sparkles className="w-4 h-4" />
                    Bizim Hekayəmiz
                  </span>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 leading-tight">{storySection.title}</h2>
                  {storySection.subtitle && <p className="text-xl text-emerald-600 mb-6 font-semibold">{storySection.subtitle}</p>}
                  <p className="text-lg text-gray-600 leading-relaxed mb-8">{storySection.description}</p>
                </motion.div>
                <div className="flex flex-wrap gap-4">
                  {['Gədəbəy', 'Tovuz', 'Gəncə', 'Şəmkir', 'Daşkəsən', 'Qax', 'Zaqatala'].map((region, index) => (
                    <motion.div key={region} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} whileHover={{ scale: 1.05, y: -2 }} className="px-4 py-2 bg-white rounded-full shadow-md border border-emerald-100 text-sm font-semibold text-gray-700 cursor-pointer">
                      {region}
                    </motion.div>
                  ))}
                </div>
              </div>
              {storySection.imageUrl && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative aspect-[4/3]">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl transform rotate-3 opacity-20" />
                  <Image src={storySection.imageUrl} alt="Bizim hekayəmiz" fill className="relative rounded-3xl shadow-2xl object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center">
                    <Award className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      ) : (
        <EmptyState message="Hekayə bölməsi yüklənmədi" />
      )}

      {/* Regions */}
      {regions.length > 0 ? (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
                <MapPin className="w-4 h-4" />
                Regionlarımız
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">Azərbaycanın Münbit Torpaqları</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Yaylaq – ən təzə məhsullar birbaşa fermerlərdən</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regions.map((region, index) => (
                <motion.div key={region.id} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} whileHover={{ y: -10 }} className="group relative overflow-hidden rounded-3xl shadow-xl bg-white">
                  {region.imageUrl ? (
                    <div className="relative h-64 overflow-hidden">
                      <Image src={region.imageUrl} alt={region.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 768px) 100vw, 33vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-64 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-emerald-400" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{region.name}</h3>
                    {region.description && <p className="text-gray-600 mb-4">{region.description}</p>}
                    {region.featuredProducts?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {region.featuredProducts.slice(0, 3).map((product, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">{product}</span>
                        ))}
                        {region.featuredProducts.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">+{region.featuredProducts.length - 3}</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <EmptyState message="Region məlumatı yüklənmədi" />
      )}

      {/* Values */}
      {valuesSection ? (
        <section className="py-24 px-4 bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-700 relative overflow-hidden">
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <motion.div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full" initial={{ x: Math.random() * winSize.w, y: Math.random() * winSize.h }} animate={{ y: [0, -50, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
            ))}
          </div>
          <div className="max-w-7xl mx-auto relative">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-full text-sm font-semibold mb-4"><Heart className="w-4 h-4" />Dəyərlərimiz</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{valuesSection.title}</h2>
              {valuesSection.subtitle && <p className="text-xl text-white/90 max-w-2xl mx-auto">{valuesSection.subtitle}</p>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
              <p className="text-xl text-white/90 text-center leading-relaxed">{valuesSection.description}</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {[
                { icon: Leaf, title: 'Orqanik', desc: '100% təbii məhsullar' },
                { icon: Shield, title: 'Keyfiyyət', desc: 'Qarantiya edilmiş təzəlik' },
                { icon: Heart, title: 'Etibar', desc: 'Müştəri məmnuniyyəti' },
              ].map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -5 }} className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }} className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mb-4"><item.icon className="w-8 h-8 text-white" /></motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/80">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <EmptyState message="Dəyərlər bölməsi yüklənmədi" />
      )}

      {/* CTA */}
      {ctaSection ? (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute inset-0">
                {[...Array(10)].map((_, i) => (
                  <motion.div key={i} className="absolute w-2 h-2 bg-white/30 rounded-full" initial={{ x: Math.random() * 800, y: Math.random() * 400 }} animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
                ))}
              </div>
              <div className="relative">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full mb-6"><Sparkles className="w-10 h-10 text-white" /></motion.div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">{ctaSection.title}</h2>
                {ctaSection.subtitle && <p className="text-xl text-white/90 mb-6">{ctaSection.subtitle}</p>}
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">{ctaSection.description}</p>
                <motion.a href="/products" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-full font-bold text-lg shadow-2xl cursor-pointer">
                  İndi Sifariş Ver
                  <ArrowRight className="w-5 h-5" />
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>
      ) : (
        <EmptyState message="Çağırış bölməsi yüklənmədi" />
      )}
    </div>
  );
}