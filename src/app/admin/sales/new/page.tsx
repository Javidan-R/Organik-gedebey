'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Save,
  Printer,
} from 'lucide-react';

import { useApp } from '@/lib/store';
import SalesHeader from '@/components/admin/sales/SalesHeader';
import SalesProductBrowser from '@/components/admin/sales/SalesProductBrowser';
import SalesConfig from '@/components/admin/sales/SalesConfig';
import SalesPayments from '@/components/admin/sales/SalesPayments';
import { PosLine, PaymentMethod } from '@/types/sales';



export const clampNumber = (num: number, min: number = 0, max: number = Infinity) =>
  Math.max(min, Math.min(max, num));

export const safeFloatFromInput = (input: string | number): number => {
  if (typeof input === 'number') return input;
  const num = parseFloat(input.replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

export const formatPrice = (price: number) =>
  `${price.toFixed(2).replace('.', ',')} AZN`;

export const WEIGHT_PRESETS = [0.25, 0.5, 1, 1.5, 2, 5];

export default function NewSalePage() {
  const { placeOrder } = useApp();

  // ============================
  // PRODUCT SELECTION (PARENT)
  // ============================
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  const handleProductSelect = useCallback((productId: string, variantId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantId(variantId);
  }, []);

  // ============================
  // LINES
  // ============================
  const [lines, setLines] = useState<PosLine[]>([]);

  const handleLineAdd = useCallback((line: PosLine) => {
    setLines((prev) => [line, ...prev]);
  }, []);

  const handleLineAdjust = useCallback((id: string, update: Partial<PosLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...update } : line))
    );
  }, []);

  const handleLineRemove = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  // ============================
  // CUSTOMER / PAYMENT
  // ============================
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);

  // ============================
  // TOTALS
  // ============================
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.lineTotal, 0),
    [lines]
  );

  const totalDue = subtotal;

  const totalPaid =
    paymentMethod === 'cash'
      ? cashAmount
      : paymentMethod === 'card'
      ? cardAmount
      : cashAmount + cardAmount;

  const balance = totalPaid - totalDue;
  const canCheckout = totalDue > 0 && totalPaid >= totalDue;

  // ============================
  // LOADING / SUCCESS
  // ============================
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ============================
  // RESET FUNCTION
  // ============================
  const handleReset = useCallback(() => {
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setNote('');
    setPaymentMethod('cash');
    setCashAmount(0);
    setCardAmount(0);
    setSelectedProductId('');
    setSelectedVariantId('');
  }, []);

  // ============================
  // CHECKOUT
  // ============================
 const handleCheckout = useCallback(async () => {
  if (!canCheckout || isSaving || !lines.length) return;

  setIsSaving(true);

  try {
    const orderItems = lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      qty: line.qty,
      priceAtOrder: line.unitPrice,
      costAtOrder: 0,
    }));

    const totalAmount = subtotal;
    const vatAmount = totalAmount * 0.18;

    // ============================
    // *** ƏSAS DÜZƏLİŞ BURADADIR ***
    // ============================
    placeOrder({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      channel: "system",

      // məhsullar
      items: orderItems,

      // status
      status: "delivered",

      // müştəri məlumatları
      customerName: customerName || "Naməlum Müştəri",
      customerPhone: customerPhone || "",
      note: note || "",
      address: "",

      // ümumi məbləğ
      totalAmount,
      vatAmount,

      // *** ÖDƏNİŞ MƏLUMATLARI ***
      paymentMethod,
      cashAmount: paymentMethod === "cash"
        ? cashAmount
        : paymentMethod === "mixed"
          ? cashAmount
          : 0,

      cardAmount: paymentMethod === "card"
        ? cardAmount
        : paymentMethod === "mixed"
          ? cardAmount
          : 0,
      total: 0
    });
    // ============================

    setIsSaving(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      handleReset();
    }, 3000);
  } catch (err) {
    console.error("Order failed:", err);
    setIsSaving(false);
    alert("Sifarişi tamamlamaq mümkün olmadı.");
  }
}, [
  canCheckout,
  isSaving,
  lines,
  subtotal,
  customerName,
  customerPhone,
  note,
  paymentMethod,
  cashAmount,
  cardAmount,
  placeOrder,
  handleReset,
]);


  // ============================
  // RENDER
  // ============================
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <SalesHeader />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          <SalesProductBrowser onSelect={handleProductSelect} />

          <SalesConfig
            onLineAdd={handleLineAdd}
            selectedProductId={selectedProductId}
            selectedVariantId={selectedVariantId}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-1">
          <SalesPayments
            lines={lines}
            subtotal={subtotal}
            totalDue={totalDue}
            totalPaid={totalPaid}
            balance={balance}
            canCheckout={canCheckout}
            isSaving={isSaving}
            paymentMethod={paymentMethod}
            cashAmount={cashAmount}
            cardAmount={cardAmount}
            customerName={customerName}
            customerPhone={customerPhone}
            note={note}
            setPaymentMethod={setPaymentMethod}
            setCashAmount={setCashAmount}
            setCardAmount={setCardAmount}
            setCustomerName={setCustomerName}
            setCustomerPhone={setCustomerPhone}
            setNote={setNote}
            handleLineAdjust={handleLineAdjust}
            handleLineRemove={handleLineRemove}
            handleReset={handleReset}
            handleCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-md text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                Satış tamamlandı!
              </h2>
              <p className="text-slate-500 mb-5">
                Ümumi məbləğ: {formatPrice(totalDue)}
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  <Save className="w-4 h-4 inline mr-2" /> Yeni satış
                </button>
                <button
                  onClick={() => {}}
                  className="rounded-xl px-4 py-2 text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-400/30"
                >
                  <Printer className="w-4 h-4 inline mr-2" /> Qəbzi çap et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
