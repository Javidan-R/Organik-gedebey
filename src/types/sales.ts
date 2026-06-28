export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';
export type LineMode = 'piece' | 'weight' | 'amount';

export type PosLine = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  unitPrice: number;
  mode: LineMode;
  qty: number;
  lineTotal: number;
  note?: string;
};
export type SalesPaymentsProps = {
  lines: PosLine[];
  subtotal: number;
  totalDue: number;
  totalPaid: number;
  balance: number;
  canCheckout: boolean;
  isSaving: boolean;

  paymentMethod: PaymentMethod;
  cashAmount: number;
  cardAmount: number;

  customerName: string;
  customerPhone: string;
  note: string;

  setPaymentMethod: (m: PaymentMethod) => void;
  setCashAmount: (a: number) => void;
  setCardAmount: (a: number) => void;
  setCustomerName: (n: string) => void;
  setCustomerPhone: (p: string) => void;
  setNote: (n: string) => void;

  handleLineAdjust: (id: string, update: Partial<PosLine>) => void;
  handleLineRemove: (id: string) => void;

  handleReset: () => void;
  handleCheckout: () => void;
};
export type SalesConfigProps = {
  onLineAdd: (line: PosLine) => void;
  selectedProductId: string;
  selectedVariantId: string;
};

export type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK";
export type TagFilter = "ALL" | "DISCOUNTED" | "NEW";
export type ViewMode = "grid" | "list";
