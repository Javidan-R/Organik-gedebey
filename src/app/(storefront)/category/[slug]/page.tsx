// src/app/category/[slug]/page.tsx
'use client'

import { useApp } from '@/lib/store'
import { useParams, notFound } from 'next/navigation'
import { StorefrontProductCard } from '@/components/StorefrontProductCard'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Carrot,
  Filter,
  Search,
  Leaf,
  Wand2,
  SortDesc,
  Tag,
  Package,
  ArrowDown,
  ArrowUp,
  ListChecks,
  XCircle,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/dist/client/link'

const PremiumInput = ({ value, onChange, placeholder }: any) => (
  <div className="relative">
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-emerald-200 bg-white shadow-inner 
        text-gray-800 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all"
    />
  </div>
)

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { categories, products } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<'recent' | 'price_asc' | 'price_desc'>('recent')

  const category = useMemo(
    () => categories.find((c) => c.slug === slug && !c.archived),
    [categories, slug],
  )

  if (!category) return notFound()

  const filteredList = useMemo(() => {
    let list = products.filter((p) => p.categoryId === category.id && !p.archived)

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.tags?.some((t) => t.toLowerCase().includes(s)),
      )
    }

    switch (sort) {
      case 'price_asc':
        list.sort(
          (a, b) => (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0),
        )
        break
      case 'price_desc':
        list.sort(
          (a, b) => (b.variants?.[0]?.price ?? 0) - (a.variants?.[0]?.price ?? 0),
        )
        break
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    }

    return list
  }, [products, category.id, searchTerm, sort])

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen pb-24"
    >
      {/* ------------------------------------------------ */}
      {/* HERO – Premium Category Banner */}
      {/* ------------------------------------------------ */}
      <section className="relative overflow-hidden rounded-b-[40px] shadow-xl">
        {/* Background Rustic Texture */}
        <div className="absolute inset-0 bg-[url('/textures/paper-grain.png')] opacity-10" />

        {/* Aura Lights */}
        <div className="absolute -top-24 -left-20 h-60 w-60 rounded-full bg-lime-200/50 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-amber-200/50 blur-3xl" />

        <div className="relative z-10 px-6 py-12 md:py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left Content */}
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 text-[12px] rounded-full text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-200">
              <Carrot className="w-4 h-4" /> Kənd Kateqoriyası
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-900 drop-shadow-sm">
              {category.name}
            </h1>

            <p className="max-w-xl text-[15px] text-gray-600 leading-relaxed">
              {category.description ||
                'Bu kateqoriyada təbii, kənd məhsullarından seçilmiş keyfiyyətli məhsulları görə bilərsiniz.'}
            </p>

            {/* Category Stats */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1">
                <Package className="w-4 h-4" /> {filteredList.length} məhsul
              </span>
              <span className="px-3 py-1 text-xs bg-amber-50 text-amber-700 rounded-full flex items-center gap-1">
                <Tag className="w-4 h-4" /> {category.slug}
              </span>
              <span className="px-3 py-1 text-xs bg-lime-50 text-lime-700 rounded-full flex items-center gap-1">
                <Leaf className="w-4 h-4" /> Təbii seçimlər
              </span>
            </div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative w-60 h-60 md:w-72 md:h-72">
              <Image
                src={category.image || '/hero-basket.png'}
                alt={category.name}
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* FILTER BAR – Premium Filters */}
      {/* ------------------------------------------------ */}
      <section className="px-4 md:px-6 mt-8">
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="w-full md:flex-grow">
              <PremiumInput
                value={searchTerm}
                placeholder="Məhsul adı və ya etiket üzrə axtar..."
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortDesc className="w-5 h-5 text-gray-500" />
              <select
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value as 'recent' | 'price_asc' | 'price_desc',
                  )
                }
                className="px-4 py-2 rounded-xl border border-emerald-200 text-gray-700 bg-white focus:ring-2 focus:ring-emerald-300"
              >
                <option value="recent">Ən yenilər</option>
                <option value="price_asc">Ucuzdan bahaya</option>
                <option value="price_desc">Bahadan ucuza</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badge-lər */}
          <AnimatePresence>
            {(searchTerm || sort !== 'recent') && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center gap-2 flex-wrap pt-1"
              >
                {searchTerm && (
                  <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    "{searchTerm}" üzrə filtr
                    <button
                      onClick={() => setSearchTerm('')}
                      className="hover:text-red-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {sort !== 'recent' && (
                  <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Sort: {sort === 'price_asc'
                      ? 'artma'
                      : sort === 'price_desc'
                      ? 'azalma'
                      : 'yeni'}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* PRODUCT GRID */}
      {/* ------------------------------------------------ */}
      <section className="px-4 md:px-6 mt-10">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-2xl font-extrabold text-emerald-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Məhsullar ({filteredList.length})
          </h2>
        </div>

        {filteredList.length ? (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6"
          >
            {filteredList.map((p) => (
              <StorefrontProductCard key={p.id} p={p} />
            ))}
          </motion.div>
        ) : (
          <div className="rounded-3xl bg-white border-2 border-dashed border-gray-200 text-center py-16 px-6 mt-10">
            <p className="text-xl font-semibold text-gray-500">
              Bu filtr üzrə məhsul tapılmadı 😔
            </p>
            <p className="text-sm text-gray-400 mt-1">Axtarış kriteriyalarını dəyişin.</p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* CATEGORY END STRIP – Marketing CTA */}
      {/* ------------------------------------------------ */}
      <section className="px-4 md:px-6 mt-14">
        <div className="rounded-3xl w-full bg-gradient-to-br from-emerald-50 to-lime-100 p-6 shadow-inner border border-emerald-100">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-1">
                <Sparkles className="w-5 h-5" />
                Digər bölmələrə də baxın
              </h3>
              <p className="mt-1 text-gray-600 text-sm">
                Oxşar kənd məhsulları üçün digər kateqoriyalara keçid edin.
              </p>
            </div>

            <Link
              href="/products"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 transition"
            >
              Bütün məhsullara bax →
            </Link>
          </div>
        </div>
      </section>
    </motion.main>
  )
}
