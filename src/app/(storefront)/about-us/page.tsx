// src/app/(storefront)/about-us/page.tsx
// Premium luxury About Us page with animations

'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles,
  Globe,
  Leaf,
  Award,
  Heart,
  ChevronRight,
  MapPin,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react'

type Section = {
  id: string
  title: string
  subtitle: string | null
  description: string
  imageUrl: string | null
  videoUrl: string | null
  displayOrder: number
  isActive: boolean
  sectionType: string
  metadata: any
}

type Region = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  featuredProducts: string[] | null
  displayOrder: number
  isActive: boolean
}

type Stat = {
  id: string
  label: string
  value: string
  description: string | null
  icon: string | null
  displayOrder: number
  isActive: boolean
}

export default function AboutUsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const { scrollY } = useScroll()

  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.8])
  const heroY = useTransform(scrollY, [0, 500], [0, 200])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sectionsRes, regionsRes, statsRes] = await Promise.all([
        fetch('/api/admin/about-us/sections'),
        fetch('/api/admin/about-us/regions'),
        fetch('/api/admin/about-us/stats'),
      ])

      const [sectionsData, regionsData, statsData] = await Promise.all([
        sectionsRes.json(),
        regionsRes.json(),
        statsRes.json(),
      ])

      setSections(sectionsData)
      setRegions(regionsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching about us data:', error)
    } finally {
      setLoading(false)
    }
  }

  const heroSection = sections.find(s => s.sectionType === 'hero')
  const storySection = sections.find(s => s.sectionType === 'story')
  const valuesSection = sections.find(s => s.sectionType === 'values')
  const ctaSection = sections.find(s => s.sectionType === 'cta')

  const iconMap: Record<string, any> = {
    Users,
    Globe,
    Award,
    Zap,
    Leaf,
    Heart,
    Shield,
    TrendingUp,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700">
          <div className="absolute inset-0 bg-black/20" />
          {/* Floating Elements */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full mb-8 border border-white/30"
            >
              <Leaf className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              {heroSection?.title || 'Təbii Məhsulların'}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-300">
                {heroSection?.subtitle || 'Zərifliyi'}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              {heroSection?.description || 'Azərbaycanın münbit torpaqlarından süfrənizə gələn ən təzə və orqanik kənd məhsulları'}
            </p>

            
          </motion.div>
        </div>

        {/* Scroll Indicator */}
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

      {/* Stats Section */}
      {stats.length > 0 && (
        <section className="py-20 px-4 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-transparent to-amber-50/50" />
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => {
                const Icon = iconMap[stat.icon || 'Sparkles'] || Sparkles
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center group"
                  >
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300"
                    >
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
                    {stat.description && (
                      <p className="text-sm text-gray-500">{stat.description}</p>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* Story Section */}
      {storySection && (
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
                    <Sparkles className="w-4 h-4" />
                    Bizim Hekayəmiz
                  </span>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 leading-tight">
                    {storySection.title}
                  </h2>
                  {storySection.subtitle && (
                    <p className="text-xl text-emerald-600 mb-6 font-semibold">
                      {storySection.subtitle}
                    </p>
                  )}
                  <p className="text-lg text-gray-600 leading-relaxed mb-8">
                    {storySection.description}
                  </p>
                </motion.div>

                <div className="flex flex-wrap gap-4">
                  {['Gədəbəy', 'Tovuz', 'Gəncə', 'Şəmkir', 'Daşkəsən', 'Qax', 'Zaqatala'].map(
                    (region, index) => (
                      <motion.div
                        key={region}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="px-4 py-2 bg-white rounded-full shadow-md border border-emerald-100 text-sm font-semibold text-gray-700 cursor-pointer"
                      >
                        {region}
                      </motion.div>
                    )
                  )}
                </div>
              </div>

              {storySection.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl transform rotate-3 opacity-20" />
                  <img
                    src={storySection.imageUrl}
                    alt="About us"
                    className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
                  />
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center"
                  >
                    <Award className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Regions Section */}
      {regions.length > 0 && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
                <MapPin className="w-4 h-4" />
                Regionlarımız
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
                Azərbaycanın Münbit Torpaqları
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Gədəbəy, Tovuz, Gəncə, Şəmkir, Daşkəsən, Qax, Zaqatala və digər regionlərdən ən təzə məhsullar
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regions.map((region, index) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group relative overflow-hidden rounded-3xl shadow-xl bg-white"
                >
                  {region.imageUrl && (
                    <div className="relative h-64 overflow-hidden">
                      <motion.img
                        src={region.imageUrl}
                        alt={region.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center transition-opacity duration-300"
                      >
                        <ArrowRight className="w-12 h-12 text-white" />
                      </motion.div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{region.name}</h3>
                    {region.description && (
                      <p className="text-gray-600 mb-4">{region.description}</p>
                    )}
                    {region.featuredProducts && region.featuredProducts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {region.featuredProducts.slice(0, 3).map((product, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold"
                          >
                            {product}
                          </span>
                        ))}
                        {region.featuredProducts.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                            +{region.featuredProducts.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      {valuesSection && (
        <section className="py-24 px-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  y: [0, -50, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-full text-sm font-semibold mb-4">
                <Heart className="w-4 h-4" />
                Dəyərlərimiz
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                {valuesSection.title}
              </h2>
              {valuesSection.subtitle && (
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  {valuesSection.subtitle}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <p className="text-xl text-white/90 text-center leading-relaxed">
                {valuesSection.description}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {[
                { icon: Leaf, title: 'Orqanik', desc: '100% təbii məhsullar' },
                { icon: Shield, title: 'Keyfiyyət', desc: 'Qarantiya edilmiş təzəlik' },
                { icon: Heart, title: 'Etibar', desc: 'Müştəri məmnuniyyəti' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mb-4"
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/80">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {ctaSection && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
            >
              <div className="absolute inset-0">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/30 rounded-full"
                    initial={{
                      x: Math.random() * 800,
                      y: Math.random() * 400,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full mb-6"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                  {ctaSection.title}
                </h2>
                {ctaSection.subtitle && (
                  <p className="text-xl text-white/90 mb-6">{ctaSection.subtitle}</p>
                )}
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  {ctaSection.description}
                </p>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-full font-bold text-lg shadow-2xl cursor-pointer"
                >
                  İndi Sifariş Ver
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}
