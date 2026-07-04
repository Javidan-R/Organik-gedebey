// src/app/admin/orders/custom/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Package, User, Phone, Calendar,
  MessageSquare, DollarSign, ShoppingBag, AlertTriangle, Sparkles,
  Ban, RefreshCw, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { formatCurrency } from '@/utils/product';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────
interface CustomItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  isCustom: boolean;
  productName: string;
  catalogPrice: number | null;
  estimatedPrice: string | null;
  adminPrice: string | null;
  isAvailable: boolean | null;
  quantity: number;
  note: string | null;
}

interface CustomOrder {
  id: string;
  userId: string;
  status: 'submitted' | 'quoted' | 'confirmed' | 'cancelled';
  customerPhone: string;
  customerNote: string | null;
  adminNote: string | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  totalEstimated: string | null;
  totalQuoted: string | null;
  submittedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string } | null;
  items: CustomItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Yeni sorğu', color: 'bg-amber-100 text-amber-700' },
  quoted: { label: 'Qiymətləndirilib', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Təsdiqlənib', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Ləğv edilib', color: 'bg-gray-200 text-gray-600' },
};

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const [itemDrafts, setItemDrafts] = useState<Record<string, { adminPrice: string; isAvailable: boolean }>>({});
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const url = filter ? `/api/admin/orders/custom?status=${filter}` : '/api/admin/orders/custom';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Məlumat yüklənə bilmədi');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      toast.error('Sorğular yüklənərkən xəta');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const selected = useMemo(() => orders.find((o) => o.id === selectedId) || null, [orders, selectedId]);

  useEffect(() => {
    if (!selected) return;
    const drafts: Record<string, { adminPrice: string; isAvailable: boolean }> = {};
    for (const item of selected.items) {
      drafts[item.id] = {
        adminPrice: item.adminPrice ?? (item.catalogPrice != null ? String(item.catalogPrice) : item.estimatedPrice ?? ''),
        isAvailable: item.isAvailable ?? true,
      };
    }
    setItemDrafts(drafts);
    setDeliveryDate(selected.deliveryDate ? selected.deliveryDate.slice(0, 10) : '');
    setDeliveryTime(selected.deliveryTimeSlot || '');
    setAdminNote(selected.adminNote || '');
  }, [selected]);

  const liveTotal = useMemo(() => {
    if (!selected) return 0;
    return selected.items.reduce((sum, item) => {
      const draft = itemDrafts[item.id];
      if (!draft || draft.isAvailable === false) return sum;
      const price = parseFloat(draft.adminPrice || '0') || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [selected, itemDrafts]);

  const handleSendQuote = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/custom/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quote',
          items: Object.entries(itemDrafts).map(([id, d]) => ({
            id,
            adminPrice: d.adminPrice ? parseFloat(d.adminPrice) : undefined,
            isAvailable: d.isAvailable,
          })),
          deliveryDate: deliveryDate || undefined,
          deliveryTimeSlot: deliveryTime || undefined,
          adminNote: adminNote || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Xəta baş verdi');
      toast.success('Təklif hazırlandı!');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/custom/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', adminNote: adminNote || undefined }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Xəta baş verdi');

      toast.success('Sifariş təsdiqləndi! WhatsApp açılır...');

      const itemsText = selected.items
        .filter((i) => (itemDrafts[i.id]?.isAvailable ?? true))
        .map((i) => `• ${i.productName} ×${i.quantity} — ${formatCurrency(parseFloat(itemDrafts[i.id]?.adminPrice || '0'))}`)
        .join('\n');

      const message = `
🌿 *ORGANİK GƏDƏBƏY* — Xüsusi Səbət Təklifi 🌿
━━━━━━━━━━━━━━━━━━━━
Salam! Sizin "Öz Səbətini Qur" sorğunuza əsasən hazırladığımız təklif:

${itemsText}
━━━━━━━━━━━━━━━━━━━━
✨ Yekun məbləğ: ${formatCurrency(liveTotal)} AZN
${deliveryDate ? `📅 Çatdırılma: ${deliveryDate}${deliveryTime ? ` (${deliveryTime})` : ''}` : ''}

Sifarişi təsdiqləmək üçün bizə cavab yazın. Təşəkkürlər! 🙏
      `.trim();

      window.open(`https://wa.me/${selected.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      setSelectedId(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    if (!confirm('Bu sorğunu ləğv etmək istədiyinizə əminsiniz?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/custom/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (!res.ok) throw new Error('Xəta baş verdi');
      toast.success('Sorğu ləğv edildi');
      setSelectedId(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-emerald-600" />
              Öz Səbətini Qur — Sorğular
            </h1>
            <p className="text-gray-500 mt-1">Müştərilərin xüsusi səbət sorğularını qiymətləndirin və təsdiqləyin</p>
          </div>
          <div className="flex gap-2">
            {['', 'submitted', 'quoted', 'confirmed', 'cancelled'].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  filter === s ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s ? STATUS_LABELS[s]?.label : 'Hamısı'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Sol panel */}
          <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
            {orders.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Hələ sorğu yoxdur</p>
              </div>
            )}
            {orders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status];
              const total = order.totalQuoted ?? order.totalEstimated;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${
                    selectedId === order.id ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo?.color}`}>{statusInfo?.label}</span>
                    <span className="text-[10px] text-gray-400">{new Date(order.submittedAt).toLocaleDateString('az-AZ')}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Müştəri'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {order.customerPhone}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{order.items.length} məhsul</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{total ? formatCurrency(parseFloat(total)) : '—'}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sağ panel */}
          <div>
            {!selected ? (
              <div className="h-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-gray-300 py-24">
                <div className="text-center text-gray-400">
                  <ChevronRight className="w-10 h-10 mx-auto mb-2" />
                  <p>Detalları görmək üçün soldan sorğu seçin</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 space-y-6">
                  {/* Müştəri */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="text-lg font-black text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-emerald-600" />{selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : 'Müştəri'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3.5 h-3.5" /> {selected.customerPhone}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_LABELS[selected.status]?.color}`}>{STATUS_LABELS[selected.status]?.label}</span>
                  </div>
                  {selected.customerNote && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 flex gap-2"><MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />{selected.customerNote}</div>
                  )}
                  {/* Items */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Sifariş tərkibi</h3>
                    {selected.items.map((item) => {
                      const draft = itemDrafts[item.id] || { adminPrice: '', isAvailable: true };
                      const disabled = selected.status === 'confirmed' || selected.status === 'cancelled';
                      return (
                        <div key={item.id} className={`rounded-xl border p-3 ${item.isCustom ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 text-sm truncate">{item.productName}</p>
                                {item.isCustom && <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Kataloqda yoxdur</span>}
                              </div>
                              {item.note && <p className="text-xs text-gray-500 mt-0.5">Qeyd: {item.note}</p>}
                              {item.isCustom && item.estimatedPrice && <p className="text-xs text-gray-400 mt-0.5">Müştərinin təxmini: {formatCurrency(parseFloat(item.estimatedPrice))}</p>}
                              <p className="text-xs text-gray-500 mt-1">Miqdar: {item.quantity}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 w-32 flex-shrink-0">
                              <div className="flex items-center gap-1 w-full">
                                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                <input type="number" disabled={disabled} value={draft.adminPrice} onChange={(e) => setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, adminPrice: e.target.value } }))} placeholder="Qiymət" className="w-full text-xs px-2 py-1 rounded-lg border border-gray-200 disabled:bg-gray-100" />
                              </div>
                              <label className="flex items-center gap-1 text-[10px] text-gray-500">
                                <input type="checkbox" disabled={disabled} checked={draft.isAvailable} onChange={(e) => setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, isAvailable: e.target.checked } }))} />
                                Mövcuddur
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Çatdırılma */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1"><Calendar className="w-3.5 h-3.5" /> Çatdırılma tarixi</label>
                      <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1"><Clock className="w-3.5 h-3.5" /> Vaxt aralığı</label>
                      <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="10:00 - 14:00" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Daxili qeyd</label>
                    <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Müştəri üçün əlavə qeyd..." />
                  </div>
                  {/* Total + Actions */}
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Hesablanmış yekun</p>
                      <p className="text-2xl font-black text-emerald-700">{formatCurrency(liveTotal)}</p>
                    </div>
                    <div className="flex gap-2">
                      {selected.status !== 'confirmed' && selected.status !== 'cancelled' && (
                        <>
                          <Button variant="ghost" onClick={handleCancel} disabled={busy} className="text-red-500"><Ban className="w-4 h-4 mr-1" /> Ləğv et</Button>
                          <Button variant="secondary" onClick={handleSendQuote} disabled={busy}>{busy ? '...' : 'Təklifi hazırla'}</Button>
                          <Button variant="primary" onClick={handleConfirm} disabled={busy}><CheckCircle2 className="w-4 h-4 mr-1" /> Təsdiqlə və Əlaqə saxla</Button>
                        </>
                      )}
                      {selected.status === 'confirmed' && <span className="flex items-center gap-1 text-emerald-700 font-bold text-sm"><CheckCircle2 className="w-4 h-4" /> Sifarişə çevrilib</span>}
                      {selected.status === 'cancelled' && <span className="flex items-center gap-1 text-gray-500 font-bold text-sm"><XCircle className="w-4 h-4" /> Ləğv edilib</span>}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}