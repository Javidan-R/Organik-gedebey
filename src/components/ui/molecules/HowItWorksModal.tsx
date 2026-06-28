// components/ui/molecules/HowItWorksModal.tsx — Yenilənmiş faiz cədvəli ilə
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBasket, CheckCircle2,
  Zap, ChevronRight, ChevronLeft, X, Shield,
  MessageCircle, Clock, BadgeInfo, User, Phone,
  Send, Sparkles, PenLine, Home,
  Truck, Store, Percent, AlertCircle, Info
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const STEPS = [
  {
    icon: ShoppingBasket, emoji: "🛒",
    title: "Məhsulu seç",
    text: "200+ kənd məhsulu içindən süfrənə uyğun olanı seç.",
    tip: "💡 Kampaniyalı məhsulları qaçırma!",
  },
  {
    icon: ShoppingBasket, emoji: "📦",
    title: "Səbətə at",
    text: "Seçdiyin məhsulları səbətə əlavə et. Miqdarı tənzimlə.",
    tip: "💡 Məhsullar təzə hazırlanır, siz gəlib götürürsünüz!",
  },
  {
    icon: MessageCircle, emoji: "💬",
    title: "WhatsApp ilə tamamla",
    text: "Məlumatlarını doldur, sifarişini təsdiqlə.",
    tip: "⚡ Tezliklə kartla ödəniş də əlavə olunacaq!",
  },
  {
    icon: CheckCircle2, emoji: "✅",
    title: "Zövq al!",
    text: "Təzə, sağlam və ləzzətli məhsullar.",
    tip: "🎁 Növbəti sifarişə bonus xal qazanarsan!",
  },
];

const DELIVERY_RATES = [
  { min: 0, max: 10, pct: 25 },
  { min: 10, max: 30, pct: 20 },
  { min: 30, max: 50, pct: 15 },
  { min: 50, max: 100, pct: 10 },
  { min: 100, max: Infinity, pct: 5 },
];

const getDeliveryFee = (total: number) => {
  for (const rate of DELIVERY_RATES) {
    if (total >= rate.min && total < rate.max) return total * (rate.pct / 100)
  }
  return total * 0.05
};

const getCurrentPct = (total: number) => {
  for (const rate of DELIVERY_RATES) {
    if (total >= rate.min && total < rate.max) return rate.pct
  }
  return 5
};

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
  cartItems?: { name: string; qty: number; price: number; image?: string; variant?: string }[];
  cartTotal?: number;
  onPlaceOrder?: (info: {
    firstName?: string; lastName?: string; phone?: string;
    deliveryMethod: 'pickup' | 'delivery';
    address?: string;
    note?: string;
  }) => void;
}

export function HowItWorksModal({ open, onClose, cartItems, cartTotal, onPlaceOrder }: HowItWorksModalProps) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useLocalStorage("how-it-works-seen", false);
  const [checked, setChecked] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setStep(0);
      setFirstName(""); setLastName(""); setPhone("");
      setDeliveryMethod('pickup'); setAddress(""); setNote("");
      setErrors({});
    }
  }, [open]);

  const isCheckout = !!cartItems && cartItems.length > 0;
  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'pickup' || !cartTotal) return 0;
    return getDeliveryFee(cartTotal);
  }, [deliveryMethod, cartTotal]);
  const currentPct = cartTotal ? getCurrentPct(cartTotal) : 0;
  const finalTotal = (cartTotal || 0) + deliveryFee;

  const validateStep = (): boolean => {
    if (!isCheckout || step !== 3) return true;
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) newErrors.firstName = 'Ad tələb olunur';
    if (!lastName.trim()) newErrors.lastName = 'Soyad tələb olunur';
    if (!phone.trim()) newErrors.phone = 'Telefon tələb olunur';
    else if (!/^[0-9\s\-+()]{7,15}$/.test(phone.trim())) newErrors.phone = 'Düzgün nömrə daxil edin';
    
    if (deliveryMethod === 'delivery' && !address.trim()) {
      newErrors.address = 'Çatdırılma ünvanı tələb olunur';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      if (!validateStep()) return;
      
      if (isCheckout && onPlaceOrder) {
        setSubmitting(true);
        await onPlaceOrder({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          deliveryMethod,
          address: deliveryMethod === 'delivery' ? address : undefined,
          note: note || undefined
        });
        setSubmitting(false);
      }
      if (checked) setDontShowAgain(true);
      onClose();
    }
  };

  const handleSkip = () => {
    if (checked) setDontShowAgain(true);
    onClose();
  };

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-green-700 p-6 text-white flex-shrink-0">
              <button onClick={handleSkip} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}>
                  <Zap className="w-6 h-6" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-black">{isCheckout ? "Sifarişi tamamla" : "Necə işləyir?"}</h2>
                  <p className="text-xs text-white/70">{isCheckout ? "WhatsApp ilə sürətli sifariş" : "4 sadə addımda sifariş ver"}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {STEPS.map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-white" : "bg-white/30"}`} />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  {!isCheckout || step < 3 ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                          <currentStep.icon className="w-8 h-8 text-emerald-700" />
                        </div>
                        <span className="text-4xl">{currentStep.emoji}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{currentStep.title}</h3>
                      <p className="text-sm text-slate-600">{currentStep.text}</p>
                      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-xs font-semibold text-amber-800">
                        <BadgeInfo className="w-4 h-4 text-amber-500" /> {currentStep.tip}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                          <PenLine className="w-8 h-8 text-emerald-700" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mt-2">Əlaqə məlumatlarınız</h3>
                        <p className="text-sm text-slate-500">Çatdırılma və ya özü götürmə üçün</p>
                      </div>

                      {/* Çatdırılma / Özü götürmə seçimi */}
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setDeliveryMethod('pickup')}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            deliveryMethod === 'pickup' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200'
                          }`}>
                          <Store className="w-5 h-5" /> Özü götürmə <span className="text-[10px]">Pulsuz</span>
                        </button>
                        <button onClick={() => setDeliveryMethod('delivery')}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            deliveryMethod === 'delivery' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200'
                          }`}>
                          <Truck className="w-5 h-5" /> Çatdırılma
                          <span className="text-[10px]">{deliveryFee.toFixed(2)} AZN</span>
                        </button>
                      </div>

                      {/* Faiz cədvəli */}
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-800">
                        <div className="flex items-center gap-1 font-bold mb-2"><Percent className="w-3.5 h-3.5" /> Çatdırılma faizləri:</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {DELIVERY_RATES.map((rate, idx) => (
                            <div key={idx} className={`flex justify-between ${currentPct === rate.pct ? 'font-black text-blue-900 bg-blue-100/50 rounded px-1 -mx-1' : ''}`}>
                              <span>{rate.min}{rate.max === Infinity ? '+' : `-${rate.max}`} AZN</span>
                              <span className="font-bold">{rate.pct}%</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-blue-600 mt-2 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Sizin səbətiniz üçün: {currentPct}%
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1"><User className="w-3.5 h-3.5" /> Ad *</label>
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Adınız"
                              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-emerald-400'}`} />
                            {errors.firstName && <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.firstName}</p>}
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1"><User className="w-3.5 h-3.5" /> Soyad *</label>
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyadınız"
                              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-emerald-400'}`} />
                            {errors.lastName && <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lastName}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1"><Phone className="w-3.5 h-3.5" /> Telefon *</label>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 000 00 00"
                            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-emerald-400'}`} />
                          {errors.phone && <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                        </div>

                        {deliveryMethod === 'delivery' && (
                          <div>
                            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1"><Home className="w-3.5 h-3.5" /> Çatdırılma ünvanı *</label>
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Küçə, bina, mənzil..." rows={2}
                              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none resize-none ${errors.address ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-emerald-400'}`} />
                            {errors.address && <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.address}</p>}
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1"><PenLine className="w-3.5 h-3.5" /> Qeyd (istəyə bağlı)</label>
                          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Əlavə qeydlər..." rows={2}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none resize-none" />
                        </div>
                      </div>

                      {/* Sifariş özeti */}
                      {cartItems && cartTotal !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                          <p className="text-xs font-bold text-emerald-800">Sifarişiniz</p>
                          {cartItems.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-emerald-700">
                              <span>{item.name} × {item.qty}</span>
                              <span className="font-bold">{(item.price * item.qty).toFixed(2)} AZN</span>
                            </div>
                          ))}
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-xs text-blue-700">
                              <span>Çatdırılma haqqı</span>
                              <span className="font-bold">{deliveryFee.toFixed(2)} AZN</span>
                            </div>
                          )}
                          <div className="border-t border-emerald-200 pt-2 flex justify-between font-black text-sm">
                            <span>Cəmi</span>
                            <span>{finalTotal.toFixed(2)} AZN</span>
                          </div>
                          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                            {deliveryMethod === 'pickup' ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                            {deliveryMethod === 'pickup' ? 'Özü götürmə — pulsuz' : 'Çatdırılma ilə'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {isLast && isCheckout && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-green-800">Hər şey hazırdır!</p>
                      <p className="text-xs text-green-700">"WhatsApp-da tamamla" düyməsinə basın</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex-shrink-0">
              <div className="flex gap-3">
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:border-emerald-300 bg-white">
                    <ChevronLeft className="w-4 h-4" /> Geri
                  </button>
                )}
                <button onClick={handleNext} disabled={submitting}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-white transition-all ${
                    isLast
                      ? "bg-green-600 hover:bg-green-700 shadow-xl shadow-green-500/20"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                  } disabled:opacity-70`}>
                  {submitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : isLast ? (
                    isCheckout ? (
                      <><Send className="w-5 h-5" /> WhatsApp-da tamamla</>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5" /> Başa düşdüm!</>
                    )
                  ) : (
                    <>İrəli <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button onClick={handleSkip} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Keç →</button>
                {!isCheckout && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-xs text-gray-500">Bir daha göstərmə</span>
                  </label>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}