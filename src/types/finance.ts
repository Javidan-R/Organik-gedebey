export type AiInsight = {
  title: string;
  summary: string;
  risks: string[];
  suggestions: string[];
};


// --------------------------------------------
export type InventoryStats = {
  totalUnits: number;
  totalCost: number;
  potentialRevenue: number;
  potentialProfit: number;
  avgMargin: number;
};


export type ScenarioResult = {
  requiredOrders: number;
  requiredDailyOrders: number;
  requiredRevenue: number;
  requiredDailyRevenue: number;
  estimatedProfit?: number;
  revenueIncrease?:number;
  profitIncrease? :number;
};


export type Money = number; // AZN
export type Batch = {
  id: string; // Purchase ID-si ilə eyni olur
  productId: string;
  variantId: string;
  date: string;        // ISO
  qty: number;         // qalan qty
  unitCost: number;    // maya (daşıma payı daxil olmaqla)
};
export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  // ödəniş şərtləri
  paymentTermDays?: number; // net-7, net-30
  isActive?: boolean;
};

export type ValuationMode = 'fifo' | 'lifo';

export type Account = {
  id: string;
  name: string;          // "Kassa", "Bank - Kapital", "POS - ABB"
  type: 'cash' | 'bank' | 'pos' | 'wallet';
  currency?: 'AZN';
  balance: Money;        // realtime balans (auto-deriv, state-də saxlanmır)
};

export type Expense = {
  id: string
  date: string
  category: string  // əvvəllər enum idi, indi azaddır
  amount: number
  accountId?: string
}
export type Purchase = {
  id: string;
  date: string;         // ISO
  supplierId: string;
  productId: string;
  variantId?: string;
  qty: number;
  unitCost: Money;      // maya
  accountId?: string;   // ödəniş dərhal edilibsə
  paid?: Money;         // dərhal ödənilən məbləğ (qalanı AP)
  note?: string;
  valuation?: 'fifo' | 'avg'; // bu sahə global `valuation` ilə əvəzlənir, amma uyğunluq üçün saxlanır
};

export type Payment = {
  id: string;
  date: string;     // ISO
  supplierId: string;
  accountId: string;
  amount: Money;    // supplier-ə ödəniş (AP azalır)
  note?: string;
};

export type ARPayment = {
  id: string;
  date: string;     // ISO
  accountId: string;
  customerName?: string;
  orderId?: string;
  amount: Money;    // müştəridən daxil olan (AR azalır)
  note?: string;
};

export type LedgerEntry = {
  id: string;
  date: string;     // ISO
  accountId: string;
  type: 'in' | 'out';
  amount: Money;
  ref?: { kind: 'expense'|'purchase'|'payment'|'arpayment'|'order'; id: string };
  memo?: string;
};

export type AP = { supplierId: string; amount: Money }; // Accounts Payable
export type AR = { customerName?: string; orderId?: string; amount: Money }; // Accounts R