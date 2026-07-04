// src/app/admin/whatsapp-inbox/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useApp } from '@/lib/store';
import { variantFinalPrice } from '@/lib/calc';
import {
  RefreshCw,
  PhoneCall,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Zap,
  Star,
} from 'lucide-react';

// ------------------------------------
// Utility functions (10+ helper)
// ------------------------------------

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Draft = {
  id: string;
  customerName?: string;
  text?: string;
  createdAt?: string;
  items?: { productId: string; qty: number }[];
};

function normalizeProductKey(idOrSlug: string) {
  return (idOrSlug || '').toString().trim().toLowerCase();
}

function findProductByKey(products: any[], key: string) {
  const n = normalizeProductKey(key);
  return (
    products.find(
      (p) =>
        normalizeProductKey(p.id) === n ||
        normalizeProductKey(p.slug) === n,
    ) || null
  );
}

function mapDraftToItems(draft: Draft, products: any[]) {
  const mapped =
    draft.items?.map((it) => {
      const p = findProductByKey(products, it.productId);
      if (!p || !p.variants?.length) return null;
      const v = p.variants[0];
      return {
        productId: p.id,
        variantId: v.id,
        qty: it.qty,
        priceAtOrder: variantFinalPrice(p, v),
        _productName: p.name,
      };
    }) ?? [];
  return mapped.filter(Boolean) as {
    productId: string;
    variantId: string;
    qty: number;
    priceAtOrder: number;
    _productName: string;
  }[];
}

function hasUnknownLines(draft: Draft, products: any[]) {
  if (!draft.items?.length) return 0;
  let unknown = 0;
  for (const it of draft.items) {
    if (!findProductByKey(products, it.productId)) unknown++;
  }
  return unknown;
}

function estimateDraftTotal(draft: Draft, products: any[]) {
  const items = mapDraftToItems(draft, products);
  const total = items.reduce(
    (s, it) => s + it.priceAtOrder * (it.qty ?? 0),
    0,
  );
  return +total.toFixed(2);
}

function buildDraftLabel(draft: Draft) {
  const name = draft.customerName || 'WhatsApp müştəri';
  return name;
}

function formatShortText(text?: string, max = 80) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

function formatTime(ts?: string) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function sortDrafts(items: Draft[]) {
  return [...items].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });
}

function canAutoImport(draft: Draft, products: any[]) {
  if (!draft.items?.length) return false;
  const unknown = hasUnknownLines(draft, products);
  return unknown === 0;
}

// ------------------------------------
// MAIN COMPONENT
// ------------------------------------

export default function WhatsappInbox() {
  const { products, placeOrder } = useApp();
  const { data, mutate, isLoading } = useSWR<{ items: Draft[] }>(
    '/api/whatsapp/inbox',
    fetcher,
    { refreshInterval: 5000 },
  );

  const [auto, setAuto] = useState(true);
  const [priorityIds, setPriorityIds] = useState<string[]>([]);

  const drafts = useMemo(
    () => sortDrafts(data?.items ?? []),
    [data?.items],
  );

  const stats = useMemo(() => {
    const total = drafts.length;
    const autoReady = drafts.filter((d) => canAutoImport(d, products))
      .length;
    const unknownLines = drafts.reduce(
      (s, d) => s + hasUnknownLines(d, products),
      0,
    );
    return { total, autoReady, unknownLines };
  }, [drafts, products]);

  const togglePriority = (id: string) => {
    setPriorityIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id],
    );
  };

  const importDraft = useCallback(
    async (d: Draft) => {
      const items = mapDraftToItems(d, products);
      if (!items.length) return;

      placeOrder({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        channel: 'whatsapp',
        items,
        customerName: buildDraftLabel(d),
        total: 0,
        totalAmount: 0,
        vatAmount: 0
      });

      await fetch('/api/whatsapp/inbox', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id }),
      });
      mutate();
    },
    [products, placeOrder, mutate],
  );

  // Auto-import: yalnız tam uyğun olan ilk draft
  useEffect(() => {
    if (!auto || !drafts.length) return;
    const next = drafts.find((d) => canAutoImport(d, products));
    if (!next) return;
    importDraft(next);
  }, [auto, drafts, products, importDraft]);

  return (
    <main className="p-4 md:p-6 space-y-6 bg-gradient-to-b from-emerald-50 via-white to-lime-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900 flex items-center gap-2">
            <Inbox className="w-7 h-7 text-emerald-600" />
            WhatsApp Inbox · ERP Bridge
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-xl">
            WhatsApp-dan gələn sifariş mesajları buraya düşür. Buradan bir kliklə
            ERP-nin sifariş sisteminə import edə bilərsən.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-emerald-100 shadow-sm text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Yenilə
          </button>

          <label className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                auto ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span>Avtomatik import</span>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="ml-1"
            />
          </label>
        </div>
      </header>

      {/* Stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard
          icon={<PhoneCall className="w-5 h-5" />}
          title="Gözləyən mesaj"
          value={stats.total}
          subtitle="WhatsApp-dan gələn aktiv draftlar"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          title="Avto-importa hazır"
          value={stats.autoReady}
          subtitle="Tam tanınan məhsullu draftlar"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          title="Naməlum sətrlər"
          value={stats.unknownLines}
          subtitle="Məhsulla eşləşməyən sətr sayı"
          tone="danger"
        />
      </section>

      {/* List */}
      <section className="card card-pad space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-emerald-600" />
            Gələn draft siyahısı
          </h2>
          <span className="text-[11px] text-slate-500">
            Yeni mesajlar 5 saniyədən bir yoxlanılır
          </span>
        </div>

        {!drafts.length ? (
          <div className="text-xs md:text-sm text-slate-500 py-8 text-center">
            Hazırda gözləyən WhatsApp sifarişi yoxdur.
          </div>
        ) : (
          <ul className="space-y-3">
            {drafts.map((d) => {
              const total = estimateDraftTotal(d, products);
              const unknown = hasUnknownLines(d, products);
              const canImport = canAutoImport(d, products);
              const isPriority = priorityIds.includes(d.id);

              return (
                <li
                  key={d.id}
                  className="rounded-2xl border border-emerald-50 bg-white shadow-sm px-3 py-3 md:px-4 md:py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  {/* Left block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                        <PhoneCall className="w-4 h-4" />
                        {buildDraftLabel(d)}
                      </span>
                      {isPriority && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <Star className="w-3 h-3" /> Prioritet
                        </span>
                      )}
                    </div>
                    {d.text && (
                      <p className="text-xs md:text-sm text-slate-700 truncate">
                        {formatShortText(d.text)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge
                        tone="primary"
                        label={`${(d.items?.length ?? 0)} sətr`}
                      />
                      <Badge
                        tone={canImport ? 'success' : 'warning'}
                        label={
                          canImport
                            ? 'Tam uyğun · import hazır'
                            : unknown
                            ? `Naməlum sətr: ${unknown}`
                            : 'Qismən uyğun'
                        }
                      />
                      {d.createdAt && (
                        <span className="text-[10px] text-slate-400">
                          {formatTime(d.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right block */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                    <div className="text-right sm:text-center">
                      <p className="text-[11px] text-slate-500">Təxmini məbləğ</p>
                      <p className="text-lg font-extrabold text-emerald-700">
                        {total.toFixed(2)} ₼
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePriority(d.id)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-xl border border-amber-100 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100"
                      >
                        <Star className="w-3 h-3" />
                        {isPriority ? 'Prioritetdən çıxar' : 'Prioritet et'}
                      </button>

                      <button
                        type="button"
                        onClick={() => importDraft(d)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 text-[11px] font-semibold text-white shadow-md hover:bg-emerald-700"
                      >
                        <Zap className="w-3 h-3" />
                        ERP-ə import
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footnote */}
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Import zamanı sistemdə “whatsapp” kanallı pending sifariş yaradılır.
        </div>
      </section>
    </main>
  );
}

// ------------------------------------
// Small components
// ------------------------------------

function StatCard({
  icon,
  title,
  value,
  subtitle,
  tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
  tone?: 'default' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-100 bg-red-50/70'
      : 'border-emerald-50 bg-white';
  return (
    <div
      className={`rounded-2xl p-4 border shadow-sm flex flex-col gap-1 ${toneClass}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span className="w-6 h-6 flex items-center justify-center text-emerald-700">
          {icon}
        </span>
        {title}
      </div>
      <div className="text-xl md:text-2xl font-extrabold text-slate-900">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] md:text-xs text-slate-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'primary' | 'success' | 'warning';
}) {
  const map: Record<typeof tone, string> = {
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[tone]}`}
    >
      {label}
    </span>
  );
}
