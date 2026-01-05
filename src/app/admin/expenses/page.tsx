'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingDown,
  PieChart,
  Plus,
  Trash2,
  Search,
  Filter,
  Notebook,
} from 'lucide-react';

// RECHARTS
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Pie,
  PieChart as PieChartContainer,
  Cell,
} from 'recharts';

const categoriesList = [
  'Əməkhaqqı',
  'Kommunal',
  'Arenda',
  'Marketinq',
  'Logistika',
  'Təmir və Təchizat',
  'Digər',
];

export default function ExpensesPage() {
  const { expenses, addExpense, removeExpense, totalExpenses, cashBalances } =
    useFinance();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Əməkhaqqı');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState('');
  const [search, setSearch] = useState('');

  const balances = cashBalances();

  // FILTER + SEARCH
  const filtered = useMemo(() => {
    let list = [...expenses];
    if (search.trim()) {
      list = list.filter((e) =>
        e.category.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [search, expenses]);

  // PIE CHART
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categoriesList) map.set(c, 0);
    filtered.forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    });
    return Array.from(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // LİNE CHART (MONTH BASED)
  const lineData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      const m = e.date.slice(0, 7);
      map.set(m, (map.get(m) ?? 0) + e.amount);
    });
    return Array.from(map)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered]);

  function add() {
    if (!amount || amount <= 0) return;

    addExpense({
      id: crypto.randomUUID(),
      date,
      category,
      amount,
      accountId,
    });

    setAmount(0);
  }

  return (
    <div className="space-y-10 p-4 md:p-8">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-800 flex items-center gap-3">
            <Wallet className="text-emerald-600" />
            Xərclər Paneli
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Mühasibatlıq üçün geniş maliyyə idarəetmə bölməsi
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl shadow-inner text-xl font-bold text-emerald-700">
          Cəmi Xərc: {totalExpenses().toFixed(2)} ₼
        </div>
      </header>

      {/* CHARTS */}
      <section className="grid md:grid-cols-3 gap-6">
        {/* PIE */}
        <div className="rounded-3xl p-5 bg-white shadow-xl border border-emerald-100">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <PieChart className="text-purple-600" />
            Kateqoriya üzrə pay
          </h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChartContainer>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ['#10b981', '#6366f1', '#f97316', '#ec4899', '#0ea5e9'][
                          i % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChartContainer>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINE CHART */}
        <div className="md:col-span-2 rounded-3xl p-5 bg-white shadow-xl border border-indigo-100">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <TrendingDown className="text-indigo-600" />
            Aylıq xərc trendi
          </h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#059669"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ADD FORM */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Plus className="text-emerald-600" />
          Yeni xərc əlavə et
        </h2>

        <div className="grid md:grid-cols-5 gap-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {categoriesList.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="number" step="0.01" value={amount}
            onChange={(e) => setAmount(+e.target.value)} className="input" placeholder="Məbləğ (₼)" />
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input">
            <option value="">Hesab seç</option>
            {balances.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button onClick={add} className="btn btn-primary">Əlavə et</button>
        </div>
      </section>

      {/* TABLE */}
      <section className="rounded-3xl border bg-white shadow-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg flex items-center gap-2">
            <Notebook className="text-blue-600" />
            Xərclər siyahısı
          </div>
          <div className="flex gap-2">
            <Search className="text-gray-400" />
            <input
              className="input"
              placeholder="Kateqoriya üzrə axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="table w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th>Tarix</th>
              <th>Kateqoriya</th>
              <th>Məbləğ</th>
              <th>Hesab</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <motion.tr
                key={e.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b hover:bg-gray-50"
              >
                <td>{format(new Date(e.date), 'dd.MM.yyyy')}</td>
                <td>{e.category}</td>
                <td className="font-semibold text-red-600">{e.amount.toFixed(2)} ₼</td>
                <td>{balances.find((a) => a.id === e.accountId)?.name || '—'}</td>
                <td>
                  <button
                    onClick={() => removeExpense(e.id)}
                    className="btn text-sm flex items-center gap-1 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
