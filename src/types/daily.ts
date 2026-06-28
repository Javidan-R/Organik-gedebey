

// TYPES
export type DayClosingForm = {
  realCustomers: number;
  realSales: number;
  realPurchases: number;
  realExpenses: number;
  realCashStart: number;
  realCashEnd: number;
  realPos: number;
  realBank: number;
  note: string;
};


export type CashBucket = {
  id: string;
  name: string;
  type: 'cash' | 'pos' | 'bank' | string;
  balance: number;
};

export type DayProps = {
  /** 
   * Əgər əvvəlki günlər üçün də form saxlayacaqsansa,
   * parent bu prop ilə data ötürə bilər.
   */
  initialForm?: DayClosingForm;
  /** Sistem gün tarixi string (YYYY-MM-DD), əks halda bugünkü tarix */
  dayKey?: string;
};