'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { addDays, parseISO, differenceInDays } from 'date-fns'
import type {
  Supplier, Account, Expense, Purchase, Payment, ARPayment, LedgerEntry, AP, AR, Money,
  Batch,
  ValuationMode
} from './types-finance' // Types below are assumed to be exported/defined in a separate file or inline here (as per original structure)
import { useApp } from '@/lib/store' // sifarişlər və məhsullar üçün

type FinanceState = {
  suppliers: Supplier[]
  accounts: Account[]
  expenses: Expense[]
  purchases: Purchase[]
  payments: Payment[]      // supplier-ə ödənişlər (AP↓)
  arPayments: ARPayment[]  // müştəridən daxil olan (AR↓)
  ledger: LedgerEntry[]    // hesablara daxıl/çıxışların jurnalı
  batches: Batch[];
  valuation: ValuationMode;
  // CRUD - Suppliers
  addSupplier: (s: Omit<Supplier,'id'>) => Supplier
  updateSupplier: (s: Supplier) => void
  removeSupplier: (id: string) => void

  // CRUD - Accounts
  addAccount: (a: Omit<Account,'id'|'balance'>) => Account
  updateAccount: (a: Account) => void
  removeAccount: (id: string) => void

  // Ops
  addExpense: (e: Omit<Expense,'id'>) => Expense
  setValuation: (m: ValuationMode) => void;
  addPurchase: (p: Omit<Purchase,'id'>) => Purchase;
  // Bu funksiya sifariş zamanı çağırılmalı, COGS hesablanmalı və inventar partiyalarını azaltmalıdır.
  consumeForSale: (items: { productId: string; variantId: string; qty: number }[]) => { totalCost: number; perItemCost: number[] };
  addPayment: (p: Omit<Payment,'id'>) => Payment
  addARPayment: (p: Omit<ARPayment,'id'>) => ARPayment

  removeExpense: (id: string) => void
  removePurchase: (id: string) => void
  removePayment: (id: string) => void
  removeARPayment: (id: string) => void

  // Derived
  totalExpenses: () => Money
  totalCOGS: () => Money // İndi satılmış malların mayasını hesablayacaq
  apSnapshot: () => AP[]           // borclar (supplier-lər üzrə)
  apAging: (todayISO?: string) => { current: AP[]; overdue: AP[]; agingBuckets: { '0-7': Money; '8-30': Money; '31-60': Money; '60+': Money } }
  arSnapshot: () => AR[]           // müştəri borcları (əgər order-lərdə "system" kanalında post-paid varsa)
  cashBalances: () => Account[]    // cari balanslar
  profitQuick: () => { revenue: Money; cogs: Money; expense: Money; profit: Money; marginPct: number }
}

const seedAccounts: Account[] = [
  { id: 'acc-cash',  name: 'Kassa', type: 'cash',  currency: 'AZN', balance: 0 },
  { id: 'acc-bank1', name: 'Bank - Kapital', type: 'bank', currency: 'AZN', balance: 0 },
  { id: 'acc-pos1',  name: 'POS - ABB', type: 'pos', currency: 'AZN', balance: 0 },
]

export const useFinance = create<FinanceState>()(persist((set, get) => ({
  suppliers: [],
  accounts: seedAccounts,
  expenses: [],
  purchases: [],
  payments: [],
  arPayments: [],
  ledger: [],
  batches: [],
  valuation: 'fifo' as ValuationMode,

  // SUPPLIERS
  addSupplier: (s) => {
    const rec: Supplier = { id: nanoid(), isActive: true, ...s }
    set(st => ({ suppliers: [rec, ...st.suppliers] }))
    return rec
  },
  updateSupplier: (s) => set(st => ({ suppliers: st.suppliers.map(x => x.id === s.id ? s : x) })),
  removeSupplier: (id) => set(st => ({ suppliers: st.suppliers.filter(x => x.id !== id) })),

  // ACCOUNTS
  addAccount: (a) => {
    const rec: Account = { id: nanoid(), balance: 0, ...a }
    set(st => ({ accounts: [rec, ...st.accounts] }))
    return rec
  },
  updateAccount: (a) => set(st => ({ accounts: st.accounts.map(x => x.id === a.id ? a : x) })),
  removeAccount: (id) => set(st => ({ accounts: st.accounts.filter(a => a.id !== id), ledger: st.ledger.filter(l => l.accountId !== id) })),

  // EXPENSE
  addExpense: (e) => {
    const rec: Expense = { id: nanoid(), ...e }
    set(st => ({
      expenses: [rec, ...st.expenses],
      ledger: e.accountId ? [
        { id: nanoid(), date: e.date, accountId: e.accountId, type:'out', amount: e.amount, ref:{kind:'expense', id: rec.id}, memo:`Expense ${e.category}` },
        ...st.ledger
      ] : st.ledger
    }))
    return rec
  },

  setValuation: (m) => set({ valuation: m }),

  // PURCHASE (COGS + optional immediate payment)
  addPurchase: (p) => {
    const id = nanoid()
    const rec: Purchase = { id, ...p }
    const newBatch: Batch = {
      id, // Alış ID-si ilə eyni olsun ki, silinməsi asan olsun
      productId: p.productId,
      variantId: p.variantId,
      date: p.date,
      qty: p.qty,
      unitCost: p.unitCost,
    }

    set(st => ({
      purchases: [rec, ...st.purchases],
      batches: [...st.batches, newBatch], // Yeni partiya əlavə edilir
      ledger: (p.accountId && p.paid && p.paid > 0) ? [
        { id: nanoid(), date: p.date, accountId: p.accountId, type:'out', amount: p.paid, ref:{kind:'purchase', id: rec.id}, memo:`Purchase immediate pay` },
        ...st.ledger
      ] : st.ledger
    }))
    return rec
  },

  // FIFO COGS HESABLAMA VƏ İNVENTAR İSTEHLAKI
  consumeForSale: (items) => {
    const state = get()
    // Partiyaların kopyasını götürürük, çünki onları dəyişdirəcəyik
    let currentBatches = [...state.batches]
    let totalCost = 0
    const perItemCost: number[] = []

    // FIFO: Ən köhnə partiyalar ilk gedir
    currentBatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const consumptionRequests = items.map(item => ({ ...item, remainingQty: item.qty }))

    for (const req of consumptionRequests) {
      let costForThisItem = 0
      let consumedQty = 0
      let remainingToConsume = req.qty

      // Ən köhnə partiyalardan istehlak edirik
      for (let i = 0; i < currentBatches.length && remainingToConsume > 0; i++) {
        const batch = currentBatches[i]

        // Yalnız uyğun məhsul/variant partiyalarından
        if (batch.productId === req.productId && (req.variantId ? batch.variantId === req.variantId : true)) {
          const qtyToTake = Math.min(remainingToConsume, batch.qty)

          if (qtyToTake > 0) {
            // Maya dəyərini hesablayırıq
            costForThisItem += qtyToTake * batch.unitCost
            consumedQty += qtyToTake
            remainingToConsume -= qtyToTake

            // Partiya miqdarını azaldırıq (lokal kopyada)
            batch.qty -= qtyToTake
          }
        }
      }

      if (remainingToConsume > 0) {
        // Stok çatışmazlığı xəbərdarlığı
        console.warn(`COGS Warning: Insufficient batch stock for ${req.productId}/${req.variantId}. Required: ${req.qty}, Consumed: ${consumedQty}`)
        // Çatışmayan hissə üçün ən yaxşı təxmin (orta maya) istifadə edirik
        if (consumedQty > 0) {
            const avgCost = costForThisItem / consumedQty;
            costForThisItem += (remainingToConsume * avgCost);
        }
      }

      totalCost += costForThisItem
      // Vahid maya dəyərini (OrderItem-ə yazılacaq) hesablayırıf
      perItemCost.push(+(costForThisItem / req.qty).toFixed(4))
    }

    // Yalnız qalığı olan partiyaları saxlayaq
    const updatedBatches = currentBatches.filter(b => b.qty > 0)
    set({ batches: updatedBatches })

    return { totalCost: +totalCost.toFixed(2), perItemCost }
  },

  // SUPPLIER PAYMENT (AP ↓)
  addPayment: (p) => {
    const rec: Payment = { id: nanoid(), ...p }
    set(st => ({
      payments: [rec, ...st.payments],
      ledger: [
        { id: nanoid(), date: p.date, accountId: p.accountId, type:'out', amount: p.amount, ref:{kind:'payment', id: rec.id}, memo:`Supplier payment` },
        ...st.ledger
      ]
    }))
    return rec
  },

  // CUSTOMER IN PAYMENT (AR ↓)
  addARPayment: (p) => {
    const rec: ARPayment = { id: nanoid(), ...p }
    set(st => ({
      arPayments: [rec, ...st.arPayments],
      ledger: [
        { id: nanoid(), date: p.date, accountId: p.accountId, type:'in', amount: p.amount, ref:{kind:'arpayment', id: rec.id}, memo:`Customer in` },
        ...st.ledger
      ]
    }))
    return rec
  },

  // REMOVES (simple)
  removeExpense:  (id) => set(st => ({ expenses: st.expenses.filter(x => x.id !== id),  ledger: st.ledger.filter(l => l.ref?.id !== id)})),
  removePurchase: (id) => set(st => ({
    purchases: st.purchases.filter(x => x.id !== id),
    batches: st.batches.filter(b => b.id !== id), // Əlaqəli partiyanı silir
    ledger: st.ledger.filter(l => l.ref?.id !== id)
  })),
  removePayment:  (id) => set(st => ({ payments: st.payments.filter(x => x.id !== id),  ledger: st.ledger.filter(l => l.ref?.id !== id)})),
  removeARPayment:(id) => set(st => ({ arPayments: st.arPayments.filter(x => x.id !== id), ledger: st.ledger.filter(l => l.ref?.id !== id)})),

  // DERIVED
  totalExpenses: () => get().expenses.reduce((s, e) => s + e.amount, 0),

  // totalCOGS – Satılmış malların maya dəyəri (Orders-dən)
  totalCOGS: () => {
    const { orders } = useApp.getState()
    const cogs = orders.reduce((s, o) =>
        s + o.items.reduce((x, it) => x + (it.costAtOrder || 0) * it.qty, 0),
        0
    )
    return +cogs.toFixed(2)
  },

  // Cash Balances – Balansları Ledger-dən hesabla
  cashBalances: () => {
    // Qeyd: Account modelindəki "balance" artıq istifadə edilmir, ledger-dən hesablanır
    const accs = get().accounts.map(a => ({ ...a, balance: 0 }))
    for (const l of get().ledger) {
      const idx = accs.findIndex(x => x.id === l.accountId)
      if (idx >= 0) accs[idx].balance += (l.type === 'in' ? l.amount : -l.amount)
    }
    return accs.map(a => ({ ...a, balance: +a.balance.toFixed(2) })) // Dəqiqlik
  },

  // AP – borclar: alışların (COGS) ödənməmiş qalığı
  apSnapshot: () => {
    const { purchases, payments } = get()
    const bySup = new Map<string, number>()
    // accrual – total purchases
    for (const p of purchases) {
      const total = p.qty * p.unitCost
      const upfront = p.paid || 0
      const due = Math.max(0, total - upfront)
      bySup.set(p.supplierId, (bySup.get(p.supplierId)||0) + due)
    }
    // direct payments lower AP
    for (const pay of payments) {
      bySup.set(pay.supplierId, (bySup.get(pay.supplierId)||0) - pay.amount)
    }
    return Array.from(bySup.entries())
      .map(([supplierId, amount]) => ({ supplierId, amount: +amount.toFixed(2) }))
      .filter(x => Math.abs(x.amount) > 0.001)
  },

  // AP aging: supplier term-lərinə görə gecikmə
  apAging: (todayISO) => {
    const today = todayISO ? parseISO(todayISO) : new Date()
    const snap = get().apSnapshot()
    const buckets = { '0-7':0, '8-30':0, '31-60':0, '60+':0 } as { [k:string]: Money }
    const { purchases, suppliers } = get()

    const current: AP[] = []
    const overdue: AP[] = []

    for (const row of snap) {
      const sup = suppliers.find(s => s.id === row.supplierId)
      const term = sup?.paymentTermDays ?? 7
      // ən son alış tarixi (sadə yanaşma)
      const lastPurchase = purchases.filter(p => p.supplierId === row.supplierId).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)
      if (!lastPurchase) continue
      const dueDate = addDays(parseISO(lastPurchase.date), term)
      const days = differenceInDays(today, dueDate)
      if (days <= 0) {
        current.push(row)
      } else {
        overdue.push(row)
        if (days <= 7) buckets['0-7'] += row.amount
        else if (days <= 30) buckets['8-30'] += row.amount
        else if (days <= 60) buckets['31-60'] += row.amount
        else buckets['60+'] += row.amount
      }
    }
    return { current, overdue, agingBuckets: {
      '0-7': +buckets['0-7'].toFixed(2),
      '8-30': +buckets['8-30'].toFixed(2),
      '31-60': +buckets['31-60'].toFixed(2),
      '60+': +buckets['60+'].toFixed(2),
    }}
  },

  // AR snapshot – əgər order-lərdə post-paid istifadə edirsənsə (opsional)
  arSnapshot: () => {
    // demo: sistem sifarişləri hamısı pre-paid sayılsın (0)
    // istəsən order modelinə "paidAt" və "paidAmount" əlavə edib, buradan AR hesablayarsan.
    return []
  },

  profitQuick: () => {
    // revenue – sifarişlərdən
    const { orders } = useApp.getState()
    const revenue = orders.reduce((s,o)=> s + o.items.reduce((x,it)=> x + it.priceAtOrder*it.qty, 0), 0)
    
    // YENİLƏNDİ: totalCOGS-dən istifadə edilir
    const cogs = get().totalCOGS() 
    
    const expense = get().totalExpenses()
    const profit = +(revenue - cogs - expense).toFixed(2)
    const marginPct = revenue > 0 ? +( (profit / revenue) * 100 ).toFixed(2) : 0
    return { revenue:+revenue.toFixed(2), cogs:+cogs.toFixed(2), expense:+expense.toFixed(2), profit, marginPct }
  },
}), { name: 'og-finance-v2' }))
