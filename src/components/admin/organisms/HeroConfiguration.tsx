'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Image as ImageIcon, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { StorefrontConfig } from '@/lib/types';
import { useApp } from '@/lib/store';

interface HeroConfigurationProps {
  config: StorefrontConfig;
  onChange: (config: StorefrontConfig) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

export function HeroConfiguration({ config, onChange, onSave, isSaving }: HeroConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'products'>('basic');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const products = useApp((s) => s.products);

  useEffect(() => {
    setHasChanges(true);
  }, [config]);

  const validateConfig = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!config.heroTitle?.trim()) {
      newErrors.push({ field: 'heroTitle', message: 'Hero başlığı mütləqdir' });
    }

    if (!config.heroSubtitle?.trim()) {
      newErrors.push({ field: 'heroSubtitle', message: 'Hero alt başlığı mütləqdir' });
    }

    if (!config.heroButtonText?.trim()) {
      newErrors.push({ field: 'heroButtonText', message: 'Düymə mətni mütləqdir' });
    }

    if (!config.heroButtonLink?.trim()) {
      newErrors.push({ field: 'heroButtonLink', message: 'Düymə linki mütləqdir' });
    }

    if (config.heroTableProductIds?.length) {
      const validIds = products.map(p => p.id);
      const invalidIds = config.heroTableProductIds.filter(id => !validIds.includes(id));
      if (invalidIds.length > 0) {
        newErrors.push({ 
          field: 'heroTableProductIds', 
          message: `Etibarsız məhsul ID-ləri: ${invalidIds.join(', ')}` 
        });
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }
    await onSave();
    setHasChanges(false);
  };

  const updateConfig = (updates: Partial<StorefrontConfig>) => {
    onChange({ ...config, ...updates });
  };

  const toggleBoolean = (field: keyof StorefrontConfig) => {
    updateConfig({ [field]: !config[field] });
  };

  const addTimelineStep = () => {
    const newSteps = config.heroTimelineSteps || [];
    updateConfig({
      heroTimelineSteps: [
        ...newSteps,
        { time: '00:00', label: 'Yeni addım', icon: '📍', color: 'emerald' }
      ]
    });
  };

  const updateTimelineStep = (index: number, updates: any) => {
    const newSteps = [...(config.heroTimelineSteps || [])];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateConfig({ heroTimelineSteps: newSteps });
  };

  const removeTimelineStep = (index: number) => {
    const newSteps = [...(config.heroTimelineSteps || [])];
    newSteps.splice(index, 1);
    updateConfig({ heroTimelineSteps: newSteps });
  };

  const addHarvestTime = () => {
    const newTimes = config.heroHarvestTimes || [];
    updateConfig({ heroHarvestTimes: [...newTimes, 'Yeni vaxt'] });
  };

  const updateHarvestTime = (index: number, value: string) => {
    const newTimes = [...(config.heroHarvestTimes || [])];
    newTimes[index] = value;
    updateConfig({ heroHarvestTimes: newTimes });
  };

  const removeHarvestTime = (index: number) => {
    const newTimes = [...(config.heroHarvestTimes || [])];
    newTimes.splice(index, 1);
    updateConfig({ heroHarvestTimes: newTimes });
  };

  const addRegion = () => {
    const newRegions = config.heroRegions || [];
    updateConfig({ heroRegions: [...newRegions, 'Yeni bölgə'] });
  };

  const updateRegion = (index: number, value: string) => {
    const newRegions = [...(config.heroRegions || [])];
    newRegions[index] = value;
    updateConfig({ heroRegions: newRegions });
  };

  const removeRegion = (index: number) => {
    const newRegions = [...(config.heroRegions || [])];
    newRegions.splice(index, 1);
    updateConfig({ heroRegions: newRegions });
  };

  const addTrustBadge = () => {
    const newBadges = config.heroTrustBadges || [];
    updateConfig({
      heroTrustBadges: [
        ...newBadges,
        { icon: '🌟', title: 'Yeni badge', description: 'Təsvir' }
      ]
    });
  };

  const updateTrustBadge = (index: number, updates: any) => {
    const newBadges = [...(config.heroTrustBadges || [])];
    newBadges[index] = { ...newBadges[index], ...updates };
    updateConfig({ heroTrustBadges: newBadges });
  };

  const removeTrustBadge = (index: number) => {
    const newBadges = [...(config.heroTrustBadges || [])];
    newBadges.splice(index, 1);
    updateConfig({ heroTrustBadges: newBadges });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Hero Bölməsi Konfiqurasiyası</h2>
            <p className="text-xs text-slate-500">Ana səhifənin görünüşünü idarə edin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Gizlət' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
          </button>
        </div>
      </div>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-800 mb-2">Xətalar:</h4>
                <ul className="space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-xs text-red-700">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {[
          { id: 'basic' as const, label: 'Əsas', icon: ImageIcon },
          { id: 'advanced' as const, label: 'Qabaqcıl', icon: Sparkles },
          { id: 'products' as const, label: 'Məhsullar', icon: Plus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {activeTab === 'basic' && (
          <BasicSettings config={config} updateConfig={updateConfig} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedSettings
            config={config}
            updateConfig={updateConfig}
            toggleBoolean={toggleBoolean}
            addTimelineStep={addTimelineStep}
            updateTimelineStep={updateTimelineStep}
            removeTimelineStep={removeTimelineStep}
            addHarvestTime={addHarvestTime}
            updateHarvestTime={updateHarvestTime}
            removeHarvestTime={removeHarvestTime}
            addRegion={addRegion}
            updateRegion={updateRegion}
            removeRegion={removeRegion}
            addTrustBadge={addTrustBadge}
            updateTrustBadge={updateTrustBadge}
            removeTrustBadge={removeTrustBadge}
          />
        )}
        {activeTab === 'products' && (
          <ProductSettings
            config={config}
            updateConfig={updateConfig}
            products={products}
          />
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </h3>
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-slate-900">{config.heroTitle}</h1>
              <p className="text-xl text-slate-600">{config.heroSubtitle}</p>
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold">
                {config.heroButtonText}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BasicSettings({ config, updateConfig }: { config: StorefrontConfig; updateConfig: (updates: Partial<StorefrontConfig>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Hero Başlığı</label>
          <input
            type="text"
            value={config.heroTitle || ''}
            onChange={(e) => updateConfig({ heroTitle: e.target.value })}
            placeholder="Təbii məhsullar bir klik uzağınızda"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Hero Alt Başlığı</label>
          <input
            type="text"
            value={config.heroSubtitle || ''}
            onChange={(e) => updateConfig({ heroSubtitle: e.target.value })}
            placeholder="100% organik və təzə"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Düymə Mətni</label>
          <input
            type="text"
            value={config.heroButtonText || ''}
            onChange={(e) => updateConfig({ heroButtonText: e.target.value })}
            placeholder="Sifariş et"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Düymə Linki</label>
          <input
            type="text"
            value={config.heroButtonLink || ''}
            onChange={(e) => updateConfig({ heroButtonLink: e.target.value })}
            placeholder="/products"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Hero Şəkil URL</label>
        <input
          type="text"
          value={config.heroImageUrl || ''}
          onChange={(e) => updateConfig({ heroImageUrl: e.target.value })}
          placeholder="/hero-image.jpg"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
        />
        <p className="text-xs text-slate-500">Boş qoyulsa default şəkil istifadə olunacaq</p>
      </div>
    </div>
  );
}

function AdvancedSettings({
  config,
  updateConfig,
  toggleBoolean,
  addTimelineStep,
  updateTimelineStep,
  removeTimelineStep,
  addHarvestTime,
  updateHarvestTime,
  removeHarvestTime,
  addRegion,
  updateRegion,
  removeRegion,
  addTrustBadge,
  updateTrustBadge,
  removeTrustBadge,
}: any) {
  return (
    <div className="space-y-6">
      {/* Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { field: 'heroTableEnabled', label: 'Məhsul Cədvəli Aktiv', desc: 'Animasiyalı məhsul cədvəlini göstər' },
          { field: 'heroSliderEnabled', label: 'Slayder Aktiv', desc: 'Məhsul slayderini göstər' },
          { field: 'heroTimelineEnabled', label: 'Vaxt Xətti Aktiv', desc: 'Yığım vaxt xəttini göstər' },
          { field: 'heroLiveActivityEnabled', label: 'Canlı Aktivlik Aktiv', desc: 'Canlı baxış sayı və sifarişləri göstər' },
          { field: 'heroWeatherEnabled', label: 'Hava Vidjeti Aktiv', desc: 'Hava məlumatlarını göstər' },
        ].map((item) => (
          <div
            key={item.field}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <button
              onClick={() => toggleBoolean(item.field)}
              className={`p-2 rounded-lg transition-colors ${
                config[item.field] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {config[item.field] ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
          </div>
        ))}
      </div>

      {/* Slider Product Count */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Slayder Məhsul Sayı</label>
        <input
          type="number"
          value={config.heroSliderProductCount || 8}
          onChange={(e) => updateConfig({ heroSliderProductCount: parseInt(e.target.value) || 8 })}
          min={1}
          max={20}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Timeline Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700">Vaxt Xətti Addımları</label>
          <button
            onClick={addTimelineStep}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Əlavə et
          </button>
        </div>
        <div className="space-y-2">
          {config.heroTimelineSteps?.map((step: any, index: number) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-4 gap-2">
                <input
                  type="text"
                  value={step.time}
                  onChange={(e) => updateTimelineStep(index, { time: e.target.value })}
                  placeholder="05:30"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  value={step.label}
                  onChange={(e) => updateTimelineStep(index, { label: e.target.value })}
                  placeholder="Arı yuvası"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  value={step.icon}
                  onChange={(e) => updateTimelineStep(index, { icon: e.target.value })}
                  placeholder="🐝"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <select
                  value={step.color}
                  onChange={(e) => updateTimelineStep(index, { color: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                >
                  <option value="amber">Amber</option>
                  <option value="sky">Sky</option>
                  <option value="emerald">Emerald</option>
                  <option value="lime">Lime</option>
                  <option value="slate">Slate</option>
                </select>
              </div>
              <button
                onClick={() => removeTimelineStep(index)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Harvest Times */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700">Yığım Vaxtları</label>
          <button
            onClick={addHarvestTime}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Əlavə et
          </button>
        </div>
        <div className="space-y-2">
          {config.heroHarvestTimes?.map((time: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={time}
                onChange={(e) => updateHarvestTime(index, e.target.value)}
                placeholder="Sübh 05:30"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <button
                onClick={() => removeHarvestTime(index)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700">Bölgələr</label>
          <button
            onClick={addRegion}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Əlavə et
          </button>
        </div>
        <div className="space-y-2">
          {config.heroRegions?.map((region: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={region}
                onChange={(e) => updateRegion(index, e.target.value)}
                placeholder="Söyüdlü, Gədəbəy"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <button
                onClick={() => removeRegion(index)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700">Etibar Badge-ləri</label>
          <button
            onClick={addTrustBadge}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Əlavə et
          </button>
        </div>
        <div className="space-y-2">
          {config.heroTrustBadges?.map((badge: any, index: number) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={badge.icon}
                  onChange={(e) => updateTrustBadge(index, { icon: e.target.value })}
                  placeholder="🌿"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  value={badge.title}
                  onChange={(e) => updateTrustBadge(index, { title: e.target.value })}
                  placeholder="100% Organik"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  value={badge.description}
                  onChange={(e) => updateTrustBadge(index, { description: e.target.value })}
                  placeholder="Təbii kənd məhsulları"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <button
                onClick={() => removeTrustBadge(index)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductSettings({ config, updateConfig, products }: { config: StorefrontConfig; updateConfig: (updates: Partial<StorefrontConfig>) => void; products: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProducts = config.heroTableProductIds || [];
  const selectedProductObjects = products.filter(p => selectedProducts.includes(p.id));

  const toggleProductSelection = (productId: string) => {
    const currentIds = config.heroTableProductIds || [];
    if (currentIds.includes(productId)) {
      updateConfig({
        heroTableProductIds: currentIds.filter(id => id !== productId)
      });
    } else {
      updateConfig({
        heroTableProductIds: [...currentIds, productId]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Selected Products */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Seçilmiş Məhsullar (Cədvəl üçün)</label>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px]">
          {selectedProductObjects.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Hələ məhsul seçilməyib</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedProductObjects.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200"
                >
                  <span className="text-lg">{product.name.charAt(0)}</span>
                  <span className="text-xs font-medium text-slate-700 truncate">{product.name}</span>
                  <button
                    onClick={() => toggleProductSelection(product.id)}
                    className="ml-auto p-1 hover:bg-red-100 rounded text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Seçilmiş məhsullar cədvəldə göstəriləcək. Boş qoyulsa avtomatik seçilir.
        </p>
      </div>

      {/* Product Search & Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Məhsul Seç</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Məhsul axtar..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
        />
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filteredProducts.slice(0, 20).map((product) => (
            <div
              key={product.id}
              onClick={() => toggleProductSelection(product.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedProducts.includes(product.id)
                  ? 'bg-emerald-50 border-emerald-500'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
                {product.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{product.name}</p>
                <p className="text-xs text-slate-500">{product.id}</p>
              </div>
              {selectedProducts.includes(product.id) && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
