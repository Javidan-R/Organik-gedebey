'use client';

import  { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Save, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Settings,
  Package,
  Clock,
  MapPin,
  Award,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { StorefrontConfig } from '@/lib/types';
import Link from 'next/link';

interface ValidationError {
  field: string;
  message: string;
}

export default function HeroConfigurationPage() {
  const storefrontConfig = useApp((s) => s.storefrontConfig);
  const updateStorefrontConfig = useApp((s) => s.updateStorefrontConfig);
  const products = useApp((s) => s.products);

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'products'>('basic');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [localConfig, setLocalConfig] = useState<StorefrontConfig>(storefrontConfig);

  useEffect(() => {
    setLocalConfig(storefrontConfig);
  }, [storefrontConfig]);

  useEffect(() => {
    setHasChanges(JSON.stringify(localConfig) !== JSON.stringify(storefrontConfig));
  }, [localConfig, storefrontConfig]);

  const validateConfig = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!localConfig.heroTitle?.trim()) {
      newErrors.push({ field: 'heroTitle', message: 'Hero başlığı mütləqdir' });
    }

    if (!localConfig.heroSubtitle?.trim()) {
      newErrors.push({ field: 'heroSubtitle', message: 'Hero alt başlığı mütləqdir' });
    }

    if (!localConfig.heroButtonText?.trim()) {
      newErrors.push({ field: 'heroButtonText', message: 'Düymə mətni mütləqdir' });
    }

    if (!localConfig.heroButtonLink?.trim()) {
      newErrors.push({ field: 'heroButtonLink', message: 'Düymə linki mütləqdir' });
    }

    if (localConfig.heroTableProductIds?.length) {
      const validIds = products.map(p => p.id);
      const invalidIds = localConfig.heroTableProductIds.filter(id => !validIds.includes(id));
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

    setIsSaving(true);
    try {
      updateStorefrontConfig(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving hero configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalConfig(storefrontConfig);
    setErrors([]);
  };

  const updateConfig = (updates: Partial<StorefrontConfig>) => {
    setLocalConfig({ ...localConfig, ...updates });
  };

  const toggleBoolean = (field: keyof StorefrontConfig) => {
    updateConfig({ [field]: !localConfig[field] });
  };

  const addTimelineStep = () => {
    const newSteps = localConfig.heroTimelineSteps || [];
    updateConfig({
      heroTimelineSteps: [
        ...newSteps,
        { time: '00:00', label: 'Yeni addım', icon: '📍', color: 'emerald' }
      ]
    });
  };

  const updateTimelineStep = (index: number, updates: any) => {
    const newSteps = [...(localConfig.heroTimelineSteps || [])];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateConfig({ heroTimelineSteps: newSteps });
  };

  const removeTimelineStep = (index: number) => {
    const newSteps = [...(localConfig.heroTimelineSteps || [])];
    newSteps.splice(index, 1);
    updateConfig({ heroTimelineSteps: newSteps });
  };

  const addHarvestTime = () => {
    const newTimes = localConfig.heroHarvestTimes || [];
    updateConfig({ heroHarvestTimes: [...newTimes, 'Yeni vaxt'] });
  };

  const updateHarvestTime = (index: number, value: string) => {
    const newTimes = [...(localConfig.heroHarvestTimes || [])];
    newTimes[index] = value;
    updateConfig({ heroHarvestTimes: newTimes });
  };

  const removeHarvestTime = (index: number) => {
    const newTimes = [...(localConfig.heroHarvestTimes || [])];
    newTimes.splice(index, 1);
    updateConfig({ heroHarvestTimes: newTimes });
  };

  const addRegion = () => {
    const newRegions = localConfig.heroRegions || [];
    updateConfig({ heroRegions: [...newRegions, 'Yeni bölgə'] });
  };

  const updateRegion = (index: number, value: string) => {
    const newRegions = [...(localConfig.heroRegions || [])];
    newRegions[index] = value;
    updateConfig({ heroRegions: newRegions });
  };

  const removeRegion = (index: number) => {
    const newRegions = [...(localConfig.heroRegions || [])];
    newRegions.splice(index, 1);
    updateConfig({ heroRegions: newRegions });
  };

  const addTrustBadge = () => {
    const newBadges = localConfig.heroTrustBadges || [];
    updateConfig({
      heroTrustBadges: [
        ...newBadges,
        { icon: '🌟', title: 'Yeni badge', description: 'Təsvir' }
      ]
    });
  };

  const updateTrustBadge = (index: number, updates: any) => {
    const newBadges = [...(localConfig.heroTrustBadges || [])];
    newBadges[index] = { ...newBadges[index], ...updates };
    updateConfig({ heroTrustBadges: newBadges });
  };

  const removeTrustBadge = (index: number) => {
    const newBadges = [...(localConfig.heroTrustBadges || [])];
    newBadges.splice(index, 1);
    updateConfig({ heroTrustBadges: newBadges });
  };

  const toggleProductSelection = (productId: string) => {
    const currentIds = localConfig.heroTableProductIds || [];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri qayıt
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Hero Bölməsi Konfiqurasiyası</h1>
                <p className="text-sm text-slate-500">Ana səhifənin görünüşünü idarə edin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Sıfırla
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Gizlət' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
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
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Konfiqurasiya uğurla yadda saxlandı</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Errors */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
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
        <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm mb-6 border border-slate-200">
          {[
            { id: 'basic' as const, label: 'Əsas', icon: ImageIcon },
            { id: 'advanced' as const, label: 'Qabaqcıl', icon: Settings },
            { id: 'products' as const, label: 'Məhsullar', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {activeTab === 'basic' && (
            <BasicSettings config={localConfig} updateConfig={updateConfig} />
          )}
          {activeTab === 'advanced' && (
            <AdvancedSettings
              config={localConfig}
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
              config={localConfig}
              updateConfig={updateConfig}
              products={products}
              toggleProductSelection={toggleProductSelection}
            />
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </h3>
            <div className="bg-gradient-to-br from-[#FAF9F5] to-[#F2FAF4] rounded-xl p-12 border border-slate-200">
              <div className="text-center space-y-6">
                <h1 className="text-5xl font-bold text-slate-900">{localConfig.heroTitle}</h1>
                <p className="text-2xl text-slate-600">{localConfig.heroSubtitle}</p>
                <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg">
                  {localConfig.heroButtonText}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BasicSettings({ config, updateConfig }: { config: StorefrontConfig; updateConfig: (updates: Partial<StorefrontConfig>) => void }) {
  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    <div className="p-6 space-y-8">
      {/* Toggles */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Aktivləşdirmələr
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { field: 'heroTableEnabled', label: 'Məhsul Cədvəli', desc: 'Animasiyalı məhsul cədvəli' },
            { field: 'heroSliderEnabled', label: 'Slayder', desc: 'Məhsul slayderi' },
            { field: 'heroTimelineEnabled', label: 'Vaxt Xətti', desc: 'Yığım vaxt xətti' },
            { field: 'heroLiveActivityEnabled', label: 'Canlı Aktivlik', desc: 'Baxış sayı və sifarişlər' },
            { field: 'heroWeatherEnabled', label: 'Hava Vidjeti', desc: 'Hava məlumatları' },
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
          className="w-48 px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Timeline Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Vaxt Xətti Addımları
          </h3>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Yığım Vaxtları
          </h3>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Bölgələr
          </h3>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Etibar Badge-ləri
          </h3>
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

function ProductSettings({ 
  config, 
  updateConfig, 
  products, 
  toggleProductSelection 
}: { 
  config: StorefrontConfig; 
  updateConfig: (updates: Partial<StorefrontConfig>) => void; 
  products: any[]; 
  toggleProductSelection: (productId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProducts = config.heroTableProductIds || [];
  const selectedProductObjects = products.filter(p => selectedProducts.includes(p.id));

  return (
    <div className="p-6 space-y-8">
      {/* Selected Products */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Seçilmiş Məhsullar (Cədvəl üçün)
        </h3>
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 min-h-[120px]">
          {selectedProductObjects.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Hələ məhsul seçilməyib</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {selectedProductObjects.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700">
                    {product.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{product.id}</p>
                  </div>
                  <button
                    onClick={() => toggleProductSelection(product.id)}
                    className="p-1.5 hover:bg-red-100 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Məhsul Seç
        </h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Məhsul axtar..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
        />
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {filteredProducts.slice(0, 50).map((product) => (
            <div
              key={product.id}
              onClick={() => toggleProductSelection(product.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                selectedProducts.includes(product.id)
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-700">
                {product.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                <p className="text-xs text-slate-500">{product.id}</p>
              </div>
              {selectedProducts.includes(product.id) && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
