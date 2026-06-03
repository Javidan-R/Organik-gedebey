import { BarChart3, Info, Wallet, ShoppingCart, Percent, Target, TrendingUp, DollarSign, Users,Hash } from "lucide-react";
import { useState, useMemo } from "react";
import ScenarioStat from "../molecules/ScenarioStat";
import { Input } from "../../atoms/input";
import { ScenarioResult } from "@/types/finance";

// Əsas Simulyator Komponenti
export default function ScenarioSimulator(props: {
  formatCurrency: (n: number) => string;
}) {
  const { formatCurrency } = props;
  
  // ----------------------------------------------------
  // 1. İLKİN STATE (Sizin tələblərinizə uyğun ilkin dəyərlər)
  // ----------------------------------------------------
  
  // Orta Sifariş Dəyəri (OSD) - Sizin tələb: 7-8 AZN
  const [avgOrderValue, setAvgOrderValue] = useState(7.5); // AZN
  
  // Aylıq Satılan Məhsul Sayı (Təxmini) - Ən vacib ilkin dəyər olaraq təyin edirik
  const [targetMonthlyOrders, setTargetMonthlyOrders] = useState(1800); // 60 sifariş/gün * 30 gün
  
  // Orta Mənfəət Marjası (%) - Fərziyyəli Marja
  const [averageMargin, setAverageMargin] = useState(30); // %

  // ----------------------------------------------------
  // 2. SCENARIO 1 - Mənfəət Hədəfi üzrə Hesablama
  // ----------------------------------------------------
  const [targetProfit, setTargetProfit] = useState(5000);
  
  const profitDrivenResult: ScenarioResult = useMemo(() => {
    if (avgOrderValue <= 0 || averageMargin <= 0) {
        return { requiredOrders: 0, requiredDailyOrders: 0, requiredRevenue: 0, requiredDailyRevenue: 0 };
    }
    
    // Mənfəət = Dövriyyə * Marja
    // Dövriyyə = Mənfəət / Marja
    const requiredRevenue = targetProfit / (averageMargin / 100);
    const requiredDailyRevenue = requiredRevenue / 30;
    
    // Sifariş Sayı = Dövriyyə / OSD
    const requiredOrders = requiredRevenue / avgOrderValue;
    const requiredDailyOrders = requiredOrders / 30;

    return { 
        requiredOrders: Math.ceil(requiredOrders), 
        requiredDailyOrders: Math.ceil(requiredDailyOrders),
        requiredRevenue, 
        requiredDailyRevenue,
        estimatedProfit: targetProfit,
    };
  }, [targetProfit, averageMargin, avgOrderValue]);


  // ----------------------------------------------------
  // 3. SCENARIO 2 - Sifariş Hədəfi üzrə Hesablama
  // ----------------------------------------------------
  const orderDrivenResult: ScenarioResult = useMemo(() => {
    if (avgOrderValue <= 0) {
        return { requiredOrders: 0, requiredDailyOrders: 0, requiredRevenue: 0, requiredDailyRevenue: 0, estimatedProfit: 0 };
    }
    
    const requiredRevenue = targetMonthlyOrders * avgOrderValue;
    const requiredDailyRevenue = requiredRevenue / 30;
    
    // Mənfəət = Dövriyyə * Marja
    const estimatedProfit = requiredRevenue * (averageMargin / 100);

    return { 
        requiredOrders: targetMonthlyOrders, 
        requiredDailyOrders: targetMonthlyOrders / 30,
        requiredRevenue, 
        requiredDailyRevenue,
        estimatedProfit: estimatedProfit,
    };
  }, [targetMonthlyOrders, averageMargin, avgOrderValue]);


  // ----------------------------------------------------
  // 4. SCENARIO 3 - OSD Artımı üzrə Hesablama (Yeni Fərziyyə)
  // ----------------------------------------------------
  const [osdIncreasePct, setOsdIncreasePct] = useState(15); // OSD-ni 15% artırsaq
  const osdIncreaseResult: ScenarioResult = useMemo(() => {
    if (avgOrderValue <= 0 || targetMonthlyOrders <= 0) {
        return { requiredOrders: 0, requiredDailyOrders: 0, requiredRevenue: 0, requiredDailyRevenue: 0, estimatedProfit: 0 };
    }
    
    const initialRevenue = targetMonthlyOrders * avgOrderValue;
    const initialProfit = initialRevenue * (averageMargin / 100);

    // Yeni OSD
    const newAvgOrderValue = avgOrderValue * (1 + osdIncreasePct / 100);
    
    // Yeni Dövriyyə (Sifariş sayı eyni qalır)
    const newRequiredRevenue = targetMonthlyOrders * newAvgOrderValue;
    const newEstimatedProfit = newRequiredRevenue * (averageMargin / 100);

    const profitIncrease = newEstimatedProfit - initialProfit;
    const revenueIncrease = newRequiredRevenue - initialRevenue;


    return { 
        requiredOrders: targetMonthlyOrders, 
        requiredDailyOrders: targetMonthlyOrders / 30,
        requiredRevenue: newRequiredRevenue, 
        requiredDailyRevenue: newRequiredRevenue / 30,
        estimatedProfit: newEstimatedProfit,
        // Düzəliş: Xalis artımı əlavə edirik
        profitIncrease,
        revenueIncrease
    } as ScenarioResult & { profitIncrease: number; revenueIncrease: number }; // Typi genişləndiririk
  }, [avgOrderValue, targetMonthlyOrders, averageMargin, osdIncreasePct]);


  return (
    <div className="space-y-8 p-6 rounded-3xl bg-slate-50 border border-slate-200">
      <h2 className="text-2xl font-extrabold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-sky-700" />
        Premium Aylıq Ssenari Simulyatoru
      </h2>

      {/* --- İLKİN GİRİŞ DƏYƏRLƏRİ --- */}
      <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50 shadow-md space-y-4">
        <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2 pb-1 border-b border-blue-100">
          <Info className="w-5 h-5" /> İlkin Daxiletmələr
        </h3>
        <p className="text-xs text-slate-700">
          Aşağıdakı ilkin dəyərləri daxil edərək, bütün 3 ssenarinin nəticələrini dinamik olaraq hesablaya bilərsiniz.
        </p>
        
        <div className="grid sm:grid-cols-3 gap-4">
          {/* OSD */}
          <Input
            label="1. Orta Sifariş Dəyəri (OSD) (₼)"
            type="number"
            value={avgOrderValue.toFixed(2)}
            onChange={(v) => setAvgOrderValue(Number(v) || 0)}
            icon={<Wallet className="w-3 h-3 text-sky-600" />}
          />
          {/* Sifariş Hədəfi */}
          <Input
            label="2. Aylıq Sifariş Sayı Fərziyyəsi (əsas fəaliyyət)"
            type="number"
            value={targetMonthlyOrders}
            onChange={(v) => setTargetMonthlyOrders(Number(v) || 0)}
            icon={<ShoppingCart className="w-3 h-3 text-orange-600" />}
          />
          {/* Marja */}
          <Input
            label="3. Orta Mənfəət Marjası (%)"
            type="number"
            value={averageMargin}
            onChange={(v) => setAverageMargin(Number(v) || 0)}
            icon={<Percent className="w-3 h-3 text-purple-600" />}
          />
        </div>

         <div className="grid sm:grid-cols-4 gap-4 text-xs pt-2">
            <ScenarioStat
              label="Fərziyyəli Aylıq Dövriyyə"
              value={formatCurrency(targetMonthlyOrders * avgOrderValue)}
              color="text-red-600"
            />
             <ScenarioStat
              label="Fərziyyəli Aylıq Mənfəət"
              value={formatCurrency(targetMonthlyOrders * avgOrderValue * (averageMargin/100))}
              color="text-emerald-600"
            />
            <ScenarioStat
              label="Fərziyyəli Günlük Sifariş"
              value={`${(targetMonthlyOrders / 30).toFixed(1)} sifariş`}
            />
             <ScenarioStat
              label="Fərziyyəli Günlük Dövriyyə"
              value={formatCurrency(targetMonthlyOrders * avgOrderValue / 30)}
            />
        </div>
      </div>
      
      {/* ——————————————————————————————————————————— */}
      {/* 💸 Ssenari 1: Hədəf Mənfəətdən Başlama (Profit-Driven) */}
      {/* ——————————————————————————————————————————— */}
      <div className="p-5 rounded-2xl border border-sky-200 bg-sky-50 shadow-md space-y-4">
        <h3 className="text-xl font-bold text-sky-800 flex items-center gap-2 pb-1 border-b border-sky-100">
          <Target className="w-5 h-5" /> 1. Xalis Mənfəət Hədəfi
        </h3>
        <p className="text-xs text-slate-700">
          **{formatCurrency(avgOrderValue)} OSD** və **{averageMargin}% marja** saxlanılarsa, təyin etdiyin mənfəətə çatmaq üçün tələb olunan dövriyyə və sifariş sayını hesablayır.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Hədəf aylıq xalis mənfəət (₼)"
            type="number"
            value={targetProfit}
            onChange={(v) => setTargetProfit(Number(v) || 0)}
            icon={<Wallet className="w-3 h-3 text-sky-600" />}
          />
           <Input
            label="İlkin OSD və Marja əsas alınır"
            type="text"
            readOnly
            value={`${formatCurrency(avgOrderValue)} OSD / ${averageMargin}% Marja`}
            className="text-slate-500 bg-slate-100 cursor-not-allowed"
            icon={<Info className="w-3 h-3 text-slate-600" />}
          />
        </div>

        <div className="grid sm:grid-cols-4 gap-4 text-xs pt-2">
          <ScenarioStat
            label="Tələb olunan Aylıq Dövriyyə"
            value={formatCurrency(profitDrivenResult.requiredRevenue)}
            color="text-red-600"
          />
          <ScenarioStat
            label="Aylıq Tələb olunan Sifariş Sayı"
            value={`${profitDrivenResult.requiredOrders} sifariş`}
            color="text-emerald-600"
          />
           <ScenarioStat
            label="Gündəlik Orta Dövriyyə"
            value={formatCurrency(profitDrivenResult.requiredDailyRevenue)}
          />
          <ScenarioStat
            label="Günlük Tələb olunan Sifariş"
            value={`${profitDrivenResult.requiredDailyOrders} sifariş`}
          />
        </div>
      </div>
      
      {/* ——————————————————————————————————————————— */}
      {/* 📦 Ssenari 2: OSD-ni Artırmağa Nə Qədər Dəyər? */}
      {/* ——————————————————————————————————————————— */}
      <div className="p-5 rounded-2xl border border-orange-200 bg-orange-50 shadow-md space-y-4">
        <h3 className="text-xl font-bold text-orange-800 flex items-center gap-2 pb-1 border-b border-orange-100">
          <TrendingUp className="w-5 h-5" /> 2. OSD Artımının Təsiri
        </h3>
        <p className="text-xs text-slate-700">
          Əgər **Aylıq Sifariş Sayınızı** (**{targetMonthlyOrders}**) sabit saxlayıb, yalnız OSD-ni artırsanız, qazancınız nə qədər olar?
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Orta Sifariş Dəyərini neçə % artırmaq hədəflənir?"
            type="number"
            value={osdIncreasePct}
            onChange={(v) => setOsdIncreasePct(Number(v) || 0)}
            icon={<Percent className="w-3 h-3 text-orange-600" />}
          />
          <Input
            label="Yeni Orta Sifariş Dəyəri (OSD)"
            type="text"
            readOnly
            value={formatCurrency(osdIncreaseResult.requiredRevenue / targetMonthlyOrders)}
            className="text-slate-500 bg-slate-100 cursor-not-allowed"
            icon={<DollarSign className="w-3 h-3 text-slate-600" />}
          />
        </div>

        <div className="grid sm:grid-cols-4 gap-4 text-xs pt-2">
          <ScenarioStat
            label="Yeni Aylıq Dövriyyə"
            value={formatCurrency(osdIncreaseResult.requiredRevenue)}
          />
          <ScenarioStat
            label="Yeni Aylıq Mənfəət"
            value={formatCurrency(osdIncreaseResult.estimatedProfit ?? 0)}
            color="text-emerald-600"
          />
          
        </div>
      </div>
      
      {/* ——————————————————————————————————————————— */}
      {/* 🧑 Ssenari 3: Müştəri Sayı Artımının Təsiri */}
      {/* ——————————————————————————————————————————— */}
      <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50 shadow-md space-y-4">
        <h3 className="text-xl font-bold text-emerald-800 flex items-center gap-2 pb-1 border-b border-emerald-100">
          <Users className="w-5 h-5" /> 3. Sifariş Sayı Artımının Təsiri
        </h3>
        <p className="text-xs text-slate-700">
          Əgər OSD və Marjanı sabit saxlayıb, yalnız müştəri axınını artırsanız, hədəflənən sifariş sayı sizə nə qədər gəlir gətirər.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Yeni Hədəf Aylıq Sifariş Sayı"
            type="number"
            // Ssenari 3-də yeni Input yoxdur, birbaşa İlkin Girişdəki Dəyər əsas alınır
            value={targetMonthlyOrders}
            onChange={(v) => setTargetMonthlyOrders(Number(v) || 0)}
            icon={<Hash className="w-3 h-3 text-emerald-600" />}
          />
          <Input
            label="İlkin OSD və Marja əsas alınır"
            type="text"
            readOnly
            value={`${formatCurrency(avgOrderValue)} OSD / ${averageMargin}% Marja`}
            className="text-slate-500 bg-slate-100 cursor-not-allowed"
            icon={<Info className="w-3 h-3 text-slate-600" />}
          />
        </div>

        <div className="grid sm:grid-cols-4 gap-4 text-xs pt-2">
          <ScenarioStat
            label="Proqnozlaşdırılan Aylıq Dövriyyə"
            value={formatCurrency(orderDrivenResult.requiredRevenue)}
            color="text-red-600"
          />
          <ScenarioStat
            label="Proqnozlaşdırılan Aylıq Xalis Mənfəət"
            value={formatCurrency(orderDrivenResult.estimatedProfit ?? 0)}
            color="text-sky-600"
          />
          <ScenarioStat
            label="Tələb olunan Günlük Sifariş Sayı"
            value={`${orderDrivenResult.requiredDailyOrders.toFixed(1)} sifariş`}
          />
          <ScenarioStat
            label="Tələb olunan Günlük Dövriyyə"
            value={formatCurrency(orderDrivenResult.requiredDailyRevenue)}
          />
        </div>
      </div>
      
      <div className="text-[11px] text-slate-600 pt-3 border-t border-slate-200">
        <p className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
          <Info className="w-3 h-3 text-blue-500" /> Strateji Xülasə
        </p>
        <p>
          Simulyasiya göstərir ki, **Ortalama Sifariş Dəyərini (OSD)** artırmaq (Ssenari 2) **yeni müştəri cəlb etməkdən** (Ssenari 3) daha sürətli və xərcsiz mənfəət artımına səbəb ola bilər. OSD-ni artırmaq üçün **`bundle`` kampaniyalar** və ya **minimum sifariş dəyəri ilə pulsuz çatdırılma** təklif edin.
        </p>
      </div>
    </div>
  );
}
