// src/app/admin/about-us/page.tsx
// Admin page for managing About Us content

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  MapPin,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Video,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Globe,
  Users,
  Award,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'

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
  createdAt: string
  updatedAt: string
}

type Region = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  featuredProducts: string[] | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type Stat = {
  id: string
  label: string
  value: string
  description: string | null
  icon: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AboutUsAdminPage() {
  const [activeTab, setActiveTab] = useState<'sections' | 'regions' | 'stats'>('sections')
  const [sections, setSections] = useState<Section[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'sections') {
        const res = await fetch('/api/admin/about-us/sections')
        const data = await res.json()
        setSections(data)
      } else if (activeTab === 'regions') {
        const res = await fetch('/api/admin/about-us/regions')
        const data = await res.json()
        setRegions(data)
      } else if (activeTab === 'stats') {
        const res = await fetch('/api/admin/about-us/stats')
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      toast.error('Məlumatlar yüklənərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (item: any, type: string) => {
    try {
      const url = item.id 
        ? `/api/admin/about-us/${type}/${item.id}`
        : `/api/admin/about-us/${type}`
      
      const method = item.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })

      if (!res.ok) throw new Error('Saxlanma xətası')

      toast.success('Uğurla saxlanıldı')
      setIsModalOpen(false)
      setEditingItem(null)
      fetchData()
    } catch (error) {
      toast.error('Saxlanma xətası')
    }
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return

    try {
      const res = await fetch(`/api/admin/about-us/${type}/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Silmə xətası')

      toast.success('Uğurla silindi')
      fetchData()
    } catch (error) {
      toast.error('Silmə xətası')
    }
  }

  const moveItem = (array: any[], index: number, direction: 'up' | 'down') => {
    const newArray = [...array]
    const temp = newArray[index]
    newArray[index] = newArray[index + (direction === 'up' ? -1 : 1)]
    newArray[index + (direction === 'up' ? -1 : 1)] = temp
    
    // Update displayOrder
    newArray.forEach((item, i) => {
      item.displayOrder = i
    })

    if (activeTab === 'sections') setSections(newArray)
    else if (activeTab === 'regions') setRegions(newArray)
    else setStats(newArray)

    // Save all items
    newArray.forEach(async (item) => {
      await handleSave(item, activeTab)
    })
  }

  const openEditModal = (item: any = null) => {
    setEditingItem(item || { displayOrder: 0, isActive: true })
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-amber-50/20 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                Haqqımızda Səhifəsi
              </h1>
              <p className="text-gray-600 mt-1">Məzmunu idarə edin</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100/50 p-2 rounded-2xl">
            {[
              { key: 'sections', label: 'Bölmələr', icon: BookOpen },
              { key: 'regions', label: 'Regionlar', icon: MapPin },
              { key: 'stats', label: 'Statistika', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-white shadow-lg text-emerald-700'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'sections' && (
            <motion.div
              key="sections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Səhifə Bölmələri</h2>
                <button
                  onClick={() => openEditModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Yeni Bölmə
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Yüklənir...</div>
              ) : sections.length === 0 ? (
                <div className="text-center py-12 bg-white/60 rounded-2xl border-2 border-dashed border-gray-300">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Hələ bölmə yoxdur</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold uppercase">
                              {section.sectionType}
                            </span>
                            <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                          </div>
                          {section.subtitle && (
                            <p className="text-gray-600 mb-2">{section.subtitle}</p>
                          )}
                          <p className="text-gray-500 line-clamp-2">{section.description}</p>
                          {section.imageUrl && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                              <ImageIcon className="w-4 h-4" />
                              Şəkil mövcuddur
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveItem(sections, index, 'up')}
                              disabled={index === 0}
                              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => moveItem(sections, index, 'down')}
                              disabled={index === sections.length - 1}
                              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </button>
                          </div>
                          <button
                            onClick={() => openEditModal(section)}
                            className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(section.id, 'sections')}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'regions' && (
            <motion.div
              key="regions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Regionlar</h2>
                <button
                  onClick={() => openEditModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Yeni Region
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Yüklənir...</div>
              ) : regions.length === 0 ? (
                <div className="text-center py-12 bg-white/60 rounded-2xl border-2 border-dashed border-gray-300">
                  <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Hələ region yoxdur</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regions.map((region, index) => (
                    <motion.div
                      key={region.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-emerald-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                    >
                      {region.imageUrl && (
                        <div className="h-32 bg-gradient-to-br from-emerald-200 to-teal-200 relative">
                          <img
                            src={region.imageUrl}
                            alt={region.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{region.name}</h3>
                        {region.description && (
                          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{region.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveItem(regions, index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem(regions, index, 'down')}
                              disabled={index === regions.length - 1}
                              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(region)}
                              className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(region.id, 'regions')}
                              className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Statistika</h2>
                <button
                  onClick={() => openEditModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Yeni Statistika
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Yüklənir...</div>
              ) : stats.length === 0 ? (
                <div className="text-center py-12 bg-white/60 rounded-2xl border-2 border-dashed border-gray-300">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Hələ statistika yoxdur</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                          {stat.icon === 'Users' && <Users className="w-6 h-6 text-white" />}
                          {stat.icon === 'Globe' && <Globe className="w-6 h-6 text-white" />}
                          {stat.icon === 'Award' && <Award className="w-6 h-6 text-white" />}
                          {stat.icon === 'Zap' && <Zap className="w-6 h-6 text-white" />}
                          {!stat.icon && <Sparkles className="w-6 h-6 text-white" />}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveItem(stats, index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveItem(stats, index, 'down')}
                            disabled={index === stats.length - 1}
                            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-gray-800 mb-1">{stat.value}</h3>
                      <p className="text-sm font-semibold text-emerald-700 mb-1">{stat.label}</p>
                      {stat.description && (
                        <p className="text-xs text-gray-500">{stat.description}</p>
                      )}
                      <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(stat)}
                          className="flex-1 p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-xs font-semibold"
                        >
                          <Edit className="w-3 h-3 inline mr-1" />
                          Dəyiş
                        </button>
                        <button
                          onClick={() => handleDelete(stat.id, 'stats')}
                          className="flex-1 p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-semibold"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Sil
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingItem?.id ? 'Düzəliş et' : 'Yeni əlavə et'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {activeTab === 'sections' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bölmə növü</label>
                      <select
                        value={editingItem?.sectionType || 'hero'}
                        onChange={(e) => setEditingItem({ ...editingItem, sectionType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="hero">Hero</option>
                        <option value="story">Hekayə</option>
                        <option value="values">Dəyərlər</option>
                        <option value="regions">Regionlar</option>
                        <option value="team">Komanda</option>
                        <option value="cta">CTA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Başlıq</label>
                      <input
                        type="text"
                        value={editingItem?.title || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Başlıq daxil edin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Alt başlıq</label>
                      <input
                        type="text"
                        value={editingItem?.subtitle || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Alt başlıq daxil edin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Təsvir</label>
                      <textarea
                        value={editingItem?.description || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Təsvir daxil edin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Şəkil URL</label>
                      <input
                        type="text"
                        value={editingItem?.imageUrl || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Şəkil URL daxil edin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Video URL</label>
                      <input
                        type="text"
                        value={editingItem?.videoUrl || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, videoUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Video URL daxil edin"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'regions' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Region adı</label>
                      <input
                        type="text"
                        value={editingItem?.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Region adı daxil edin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Təsvir</label>
                      <textarea
                        value={editingItem?.description || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Təsvir daxil edin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Şəkil URL</label>
                      <input
                        type="text"
                        value={editingItem?.imageUrl || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Şəkil URL daxil edin"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'stats' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Dəyər</label>
                      <input
                        type="text"
                        value={editingItem?.value || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Məs: 100+"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Etiket</label>
                      <input
                        type="text"
                        value={editingItem?.label || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Məs: Məmnun müştəri"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Təsvir</label>
                      <textarea
                        value={editingItem?.description || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Qısa təsvir"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">İkon</label>
                      <select
                        value={editingItem?.icon || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">İkon seçin</option>
                        <option value="Users">İstifadəçi</option>
                        <option value="Globe">Qlob</option>
                        <option value="Award">Mükafat</option>
                        <option value="Zap">Zap</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  <X className="w-5 h-5 inline mr-2" />
                  Ləğv et
                </button>
                <button
                  onClick={() => handleSave(editingItem, activeTab)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  Saxla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
