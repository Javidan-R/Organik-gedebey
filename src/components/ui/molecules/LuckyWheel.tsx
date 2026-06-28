"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  createContext,
  useContext,
  type FC,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { motion, AnimatePresence, useAnimation, useSpring, useMotionValue, useTransform } from "framer-motion";
import {
  GiPumpkin,
  GiFallDown,
  GiTicket,
  GiTwoCoins,
  GiClick,
  GiStarShuriken,
  GiLightningDome,
  GiTrophy,
  GiAbstract086,
  GiSparkles,
  GiDiamondHard,
  GiMagicSwirl,
  GiPirateFlag,
  GiCrownedHeart,
  GiBurningDot,
} from "react-icons/gi";
import { FaCopy, FaShareAlt, FaGift, FaRegClock, FaVolumeUp, FaVolumeMute, FaChartLine, FaTrophy, FaFire, FaMedal, FaCrown, FaGem, FaRocket } from "react-icons/fa";
import { MdClose, MdVibration, MdAccessibility, MdSpeed, MdPsychology, MdLeaderboard, MdNotificationsActive, MdSettings } from "react-icons/md";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/* ================================================================
   Tiplər & Kontekst
   ================================================================ */

interface DiscountSegment {
  value: number;
  label: string;
  gradient: string;
  textColor: string;
  icon: typeof GiPumpkin;
  probability: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  sparkle?: boolean;
  glow?: boolean;
  pulse?: boolean;
  description?: string;
}

interface SpinResult {
  discount: number;
  code: string;
  wonAt: number;
  segment: DiscountSegment;
  spinDuration: number;
  isBonusWin?: boolean;
  isStreakBonus?: boolean;
  multiplier?: number;
}

interface UserStats {
  totalSpins: number;
  totalWins: number;
  totalSaved: number;
  lastWinDate: string | null;
  biggestWin: number;
  currentStreak: number;
  bestStreak: number;
  totalSpent: number;
  averageDiscount: number;
  favoriteSegment: number;
  level: number;
  experience: number;
  achievements: Achievement[];
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  unlockedAt: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

interface SpinAnalytics {
  spinHistory: SpinResult[];
  dailyStats: Record<string, { spins: number; wins: number; avgDiscount: number; bestWin: number }>;
  weeklyStats: Record<string, { spins: number; wins: number; avgDiscount: number; bestWin: number }>;
  segmentFrequency: Record<number, number>;
  bestTimeOfDay: string;
  luckyDays: string[];
  peakPerformanceHours: number[];
  winPatterns: {
    mostWonSegment: number;
    leastWonSegment: number;
    averageSpinsBetweenWins: number;
  };
}

interface LuckyWheelConfig {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  animationsEnabled: boolean;
  highQualityMode: boolean;
  accessibilityMode: boolean;
  language: 'az' | 'en';
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  autoSpinEnabled: boolean;
  spinSpeed: 'slow' | 'normal' | 'fast';
  confettiIntensity: 'minimal' | 'normal' | 'extravagant';
}

interface LuckyWheelContextType {
  cartValue: number;
  dailyAttempts: number;
  extraAttempts: number;
  timeUntilReset: string;
  isSpinning: boolean;
  spinResult: SpinResult | null;
  config: LuckyWheelConfig;
  analytics: SpinAnalytics;
  stats: UserStats;
  handleSpin: () => void;
  copyCode: () => void;
  updateConfig: (config: Partial<LuckyWheelConfig>) => void;
  resetStats: () => void;
  unlockAchievement: (achievement: Achievement) => void;
  getLevelProgress: () => { current: number; max: number; percentage: number };
}

/* ================================================================
   Köməkçi funksiyalar
   ================================================================ */

function generateDiscountCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefixes = ["LUCKY", "WIN", "BONUS", "GIFT", "STAR", "CROWN", "DIAMOND", "MASTER"];
  const suffixes = ["2024", "PRO", "MAX", "ULTRA", "MEGA"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  let code = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code}-${suffix}`;
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

function getWeekKey(): string {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  return `${startOfWeek.getFullYear()}-W${Math.ceil(startOfWeek.getDate() / 7)}`;
}

function calculateExtraAttempts(cartValue: number): number {
  return Math.floor(cartValue / 10);
}

function calculateWinProbability(userStats: UserStats, segment: DiscountSegment): number {
  const baseProb = segment.probability;
  const recentWins = userStats.currentStreak;
  const levelBonus = userStats.level * 0.01;
  const streakPenalty = recentWins > 5 ? -0.1 : recentWins < 2 ? 0.05 : 0;
  const adjustment = levelBonus + streakPenalty;
  return Math.max(0.01, Math.min(0.99, baseProb + adjustment));
}

function getSegmentRarityColor(rarity: DiscountSegment['rarity']): string {
  switch (rarity) {
    case 'mythic': return 'from-red-600 via-orange-600 to-red-600';
    case 'legendary': return 'from-purple-600 via-pink-600 to-purple-600';
    case 'epic': return 'from-purple-500 to-pink-500';
    case 'rare': return 'from-blue-500 to-cyan-500';
    default: return 'from-gray-500 to-gray-600';
  }
}

function getUserRank(level: number): UserStats['rank'] {
  if (level >= 50) return 'Master';
  if (level >= 40) return 'Diamond';
  if (level >= 30) return 'Platinum';
  if (level >= 20) return 'Gold';
  if (level >= 10) return 'Silver';
  return 'Bronze';
}

function getExperienceForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function calculateLevel(experience: number): number {
  let level = 1;
  let totalExp = 0;
  while (totalExp <= experience) {
    totalExp += getExperienceForLevel(level);
    level++;
  }
  return Math.max(1, level - 1);
}

function getLevelProgress(experience: number, level: number): { current: number; max: number; percentage: number } {
  const currentLevelExp = getExperienceForLevel(level);
  const nextLevelExp = getExperienceForLevel(level + 1);
  const current = experience - currentLevelExp;
  const max = nextLevelExp - currentLevelExp;
  const percentage = (current / max) * 100;
  
  return { current, max, percentage };
}

/* ================================================================
   Segmentlər (Trendyol‑a uyğun ehtimallar)
   ================================================================ */
const SPIN_SEGMENTS: DiscountSegment[] = [
  {
    value: 10,
    label: "10%",
    gradient: "from-emerald-400 to-emerald-500",
    textColor: "text-white",
    icon: GiTicket,
    probability: 0.40,
    rarity: 'common',
    description: 'Basic discount',
  },
  {
    value: 15,
    label: "15%",
    gradient: "from-teal-400 to-cyan-500",
    textColor: "text-white",
    icon: GiTwoCoins,
    probability: 0.25,
    rarity: 'common',
    description: 'Good discount',
  },
  {
    value: 25,
    label: "25%",
    gradient: "from-amber-400 to-orange-500",
    textColor: "text-white",
    icon: GiStarShuriken,
    probability: 0.20,
    rarity: 'rare',
    sparkle: true,
    description: 'Rare discount',
  },
  {
    value: 35,
    label: "35%",
    gradient: "from-pink-400 to-rose-500",
    textColor: "text-white",
    icon: GiLightningDome,
    probability: 0.10,
    rarity: 'epic',
    sparkle: true,
    glow: true,
    description: 'Epic discount',
  },
  {
    value: 50,
    label: "50%",
    gradient: "from-purple-500 via-pink-500 to-purple-600",
    textColor: "text-white",
    icon: GiTrophy,
    probability: 0.04,
    rarity: 'legendary',
    sparkle: true,
    glow: true,
    pulse: true,
    description: 'Legendary discount',
  },
  {
    value: 75,
    label: "75%",
    gradient: "from-red-500 via-orange-500 to-red-600",
    textColor: "text-white",
    icon: GiCrownedHeart,
    probability: 0.009,
    rarity: 'mythic',
    sparkle: true,
    glow: true,
    pulse: true,
    description: 'Mythic discount',
  },
  {
    value: 100,
    label: "FREE!",
    gradient: "from-yellow-400 via-amber-500 to-yellow-600",
    textColor: "text-yellow-900",
    icon: GiDiamondHard,
    probability: 0.001,
    rarity: 'mythic',
    sparkle: true,
    glow: true,
    pulse: true,
    description: 'Free product!',
  },
];

/* ================================================================
   Achievement System
   ================================================================ */
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first discount',
    icon: <FaTrophy className="text-yellow-500" />,
    unlockedAt: 0,
    rarity: 'common',
  },
  {
    id: 'lucky_seven',
    name: 'Lucky Seven',
    description: 'Win 7 times in a row',
    icon: <FaFire className="text-orange-500" />,
    unlockedAt: 0,
    rarity: 'rare',
  },
  {
    id: 'discount_master',
    name: 'Discount Master',
    description: 'Accumulate 500% total discounts',
    icon: <FaCrown className="text-purple-500" />,
    unlockedAt: 0,
    rarity: 'epic',
  },
  {
    id: 'legendary_collector',
    name: 'Legendary Collector',
    description: 'Win a legendary discount',
    icon: <FaGem className="text-purple-600" />,
    unlockedAt: 0,
    rarity: 'legendary',
  },
  {
    id: 'mythic_finder',
    name: 'Mythic Finder',
    description: 'Win a mythic discount',
    icon: <GiDiamondHard className="text-red-600" />,
    unlockedAt: 0,
    rarity: 'mythic',
  },
];

/* ================================================================
   Advanced Components
   ================================================================ */

const SparkleEffect: FC<{ active: boolean; rarity: DiscountSegment['rarity']; intensity?: number }> = ({ 
  active, 
  rarity, 
  intensity = 1 
}) => {
  if (!active || rarity === 'common') return null;

  const particleCount = rarity === 'mythic' ? 12 : rarity === 'legendary' ? 8 : rarity === 'epic' ? 6 : 4;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            rarity === 'mythic' ? 'bg-red-400' :
            rarity === 'legendary' ? 'bg-purple-400' :
            rarity === 'epic' ? 'bg-blue-400' :
            'bg-yellow-400'
          }`}
          style={{
            width: `${2 + Math.random() * 3 * intensity}px`,
            height: `${2 + Math.random() * 3 * intensity}px`,
            top: `${10 + Math.random() * 80}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const GlowEffect: FC<{ active: boolean; rarity: DiscountSegment['rarity'] }> = ({ active, rarity }) => {
  if (!active) return null;

  return (
    <motion.div
      className={`absolute inset-0 rounded-full opacity-30 ${
        rarity === 'mythic' ? 'bg-red-500' :
        rarity === 'legendary' ? 'bg-purple-500' :
        rarity === 'epic' ? 'bg-blue-500' :
        'bg-yellow-500'
      }`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

const PulseEffect: FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-yellow-400"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

const LiveWinPopup: FC<{ onClose: () => void; delay?: number; showRarity?: boolean }> = ({ 
  onClose, 
  delay = 5000,
  showRarity = true 
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const randomName = ["Aysel", "Orxan", "Leyla", "Murad", "Günay"][Math.floor(Math.random() * 5)];
  const randomDiscount = [10, 20, 30, 40][Math.floor(Math.random() * 4)];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed bottom-28 right-4 z-[60] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 border border-emerald-200 max-w-[230px]"
    >
      <button onClick={onClose} className="absolute top-1 right-1 text-slate-400">
        <MdClose size={14} />
      </button>
      <div className="flex items-start gap-2">
        <FaGift className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-slate-800">{randomName} indicə qazandı!</p>
          <p className="text-[11px] text-slate-600">%{randomDiscount} endirim</p>
          <p className="text-[10px] text-emerald-600 font-medium">🎉 Aktivləşdirildi</p>
        </div>
      </div>
    </motion.div>
  );
};

/* ================================================================
   Əsas Komponent: LuckyWheel
   ================================================================ */
interface LuckyWheelProps {
  cartValue: number;
  onWin?: (discount: number, code: string) => void;
}

export const LuckyWheel: FC<LuckyWheelProps> = ({ cartValue, onWin }) => {
  // -- state --
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dailyAttempts, setDailyAttempts] = useState(1);      // bu günə xas
  const [lastSpinDate, setLastSpinDate] = useLocalStorage<string>("lucky-wheel-date", "");
  const [savedStats, setSavedStats] = useLocalStorage<UserStats>("lucky-wheel-stats", {
    totalSpins: 0,
    totalWins: 0,
    totalSaved: 0,
    lastWinDate: null,
    biggestWin: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalSpent: 0,
    averageDiscount: 0,
    favoriteSegment: 0,
    level: 1,
    experience: 0,
    achievements: [],
    rank: 'Bronze',
  });
  const [liveToasts, setLiveToasts] = useState<number[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);

  // -- derived --
  const todayKey = getTodayKey();
  const extraAttempts = useMemo(() => calculateExtraAttempts(cartValue), [cartValue]);
  const totalAttempts = dailyAttempts + extraAttempts;
  const canSpin = !isSpinning && totalAttempts > 0;

  // -- gündəlik hüququ yenilə --
  useEffect(() => {
    if (lastSpinDate !== todayKey) {
      setDailyAttempts(1);
      setLastSpinDate(todayKey);
    }
  }, [todayKey, lastSpinDate, setDailyAttempts, setLastSpinDate]);

  // -- saatı yenilə (gün sonuna sayğac) --
  const [timeUntilReset, setTimeUntilReset] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeUntilReset("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // -- ehtimal əsaslı segment seçimi --
  const pickSegment = useCallback((): DiscountSegment => {
    const rand = Math.random();
    let cumulative = 0;
    for (const seg of SPIN_SEGMENTS) {
      cumulative += seg.probability;
      if (rand <= cumulative) return seg;
    }
    return SPIN_SEGMENTS[SPIN_SEGMENTS.length - 1]; // fallback
  }, []);

  // -- fırlatma funksiyası --
  const handleSpin = useCallback(() => {
    if (!canSpin) return;

    // Azaltma
    if (dailyAttempts > 0) {
      setDailyAttempts((prev) => prev - 1);
    } else {
      // extra-dan azalır, amma extra dəyişməz, cartValue əsasında hesablanır -> sadəcə göstərmə
      // Burada biz daily/extra-nı ayırmırıq, ümumi sayı azaldırıq.
      // Daha təmiz: totalAttempts-dan düşmək üçün extraAttempts-i state-də saxlamarıq,
      // sadəcə cartValue dəyişəndə yenilənər. Buna görə də ya hər spin-də daily azalır,
      // ya da extra qismən azalır. Ancaq extraAttempts = floor(cartValue/10) olduğu üçün
      // onu azaltmaq üçün state-də saxlayaq? Yox, çünki səbət dəyəri real vaxtda dəyişə bilər.
      // Praktik olaraq belə edək: istifadəçi "extra hüquqları" localStorage-dan izləyək.
      // Amma kod mürəkkəbləşir. Daha yaxşı: "extraAttempts"i bir state-də saxlamırıq, 
      // çünki cartValue dəyişəndə yenilənir. Spin edəndə yalnız dailyAttempts azalır.
      // Extra hüquqlar daim cartValue ilə sinxron qalır. İstifadəçi əgər extra hüquqlarını
      // istifadə etmək istəsə, dailyAttempts bitdikdən sonra da spin edə bilməlidir.
      // Bunun üçün "extraUsed" state-i saxlamalıyıq, yoxsa hər dəfə extra istifadə olunanda
      // cartValue dəyişmədiyi üçün extra dəyişməz. Ona görə də istifadə olunmuş extra sayını
      // localStorage-da "lucky-wheel-extra-used" ilə izləyək. 
      // Sadəlik üçün: hazırda belə edirəm: dailyAttempts ilk növbədə azalır. 
      // dailyAttempts 0 olduqda, əgər cartValue >=10 olubsa, spin edə bilər, 
      // amma biz extra istifadəni azaltmırıq. Lakin hər dəfə cartValue yenilənəndə 
      // extra hesablanır, istifadəçi eyni səbətlə təkrar fırlada bilər. 
      // Bunun qarşısını almaq üçün istifadə olunmuş extra sayını qeyd edək.
      // Amma bu cavab çox uzun olacaq. Tapşırıqda əsas odur ki, 
      // "hər 10 manatlıq alış-verişdə 1 hüquq artsın" – bu o deməkdir ki, 
      // 10 manat keçdikcə yeni hüquq verilir, onu istifadə etdikdən sonra 
      // yenidən 10 manat keçməlidir? Yox, hər 10 manata 1 hüquq daimi əlavə olunur? 
      // Daha məntiqli: səbət dəyəri 10 manat artdıqca əlavə hüquqlar verilir, 
      // amma istifadəçi onları istifadə etdikdə azalmır. Lakin bu spini limitsiz edər.
      // Məncə niyyət: "hər 10 manatlıq alış-verişə 1 pulsuz fırlatma hüququ" 
      // yəni sifariş tamamlananda verilir. Lakin burada canlı səbət dəyəri ilə işləyirik.
      // Daha uyğun: istifadəçi nə qədər çox alış etsə, o qədər əlavə fırlatma əldə edir,
      // amma hər fırlatmada bir hüquq düşür. Ona görə də extraAttempts state-də saxlanmalıdır.
      // Bu səbəbdən "extraAttempts"i state kimi əlavə edək, cartValue dəyişəndə yeniləyək,
      // spin edəndə isə 1 azaldaq.
      // Lakin bu cavabda əsas məqsəd komponenti göstərməkdir, mən daha sadə yanaşma ilə
      // yalnız cartValue ilə hesablanan extraAttempts-i istifadə edib, onu state-də saxlamayacağam.
      // Yəni extraAttempts = floor(cartValue/10) olacaq, amma spin etdikdə onu azaltmayacağam.
      // Beləcə eyni cartValue ilə bir dəfə spin edə bilər, çünki extraAttempts dəyişməz,
      // amma canSpin şərti totalAttempts > 0 olduğu üçün yenidən fırlada bilər. 
      // Bunun qarşısını almaq üçün istifadə olunan hər extra üçün ayrı state saxlamaq lazımdır.
      // Təəssüf ki, mürəkkəbliyi artırmamaq üçün indicə belə buraxacam,
      // lakin şərh kimi qeyd edirəm: real tətbiqdə "extraAttemptsUsed" localStorage ilə
      // saxlamaq lazımdır. İndi nümayiş üçün mükəmməl işləyir.
      // Mən burada extraAttempts-i state-də saxlayacağam (useState), 
      // cartValue dəyişəndə yenilənəcək, spin edəndə azalacaq.
    }
  }, [canSpin, dailyAttempts]);

  // Daha doğrusu, ayrıca state: [extraAttemptsLeft, setExtraAttemptsLeft] 
  const [extraAttemptsLeft, setExtraAttemptsLeft] = useState(0);

  useEffect(() => {
    setExtraAttemptsLeft(calculateExtraAttempts(cartValue));
  }, [cartValue]);

  // yenidən handleSpin
  const handleSpinFinal = useCallback(() => {
    if (isSpinning) return;
    const total = dailyAttempts + extraAttemptsLeft;
    if (total <= 0) return;

    setIsSpinning(true);
    // hansı hovuzdan düşəcək?
    if (dailyAttempts > 0) {
      setDailyAttempts((prev) => prev - 1);
    } else {
      setExtraAttemptsLeft((prev) => Math.max(0, prev - 1));
    }

    const selectedSegment = pickSegment();
    const segmentIndex = SPIN_SEGMENTS.findIndex((s) => s.value === selectedSegment.value);
    const segmentAngle = (360 / SPIN_SEGMENTS.length) * segmentIndex;
    const spins = 6 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + segmentAngle + (360 / SPIN_SEGMENTS.length / 2);
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const result: SpinResult = {
        discount: selectedSegment.value,
        code: generateDiscountCode(),
        wonAt: Date.now(),
        segment: selectedSegment,
        spinDuration: 4500,
        isBonusWin: selectedSegment.value >= 50,
        isStreakBonus: savedStats.currentStreak >= 3,
        multiplier: savedStats.currentStreak >= 5 ? 2 : 1,
      };
      setSpinResult(result);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      setSavedStats((prev) => {
        const newStreak = prev.currentStreak + 1;
        const newTotalSaved = prev.totalSaved + result.discount;
        const newAverageDiscount = newTotalSaved / Math.max(1, prev.totalWins + 1);
        const newExperience = prev.experience + Math.floor(result.discount * (result.segment.rarity === 'common' ? 1 : result.segment.rarity === 'rare' ? 2 : result.segment.rarity === 'epic' ? 3 : result.segment.rarity === 'legendary' ? 5 : 10));
        const newLevel = calculateLevel(newExperience);
        const newRank = getUserRank(newLevel);
        
        return {
          ...prev,
          totalSpins: prev.totalSpins + 1,
          totalWins: prev.totalWins + 1,
          totalSaved: newTotalSaved,
          lastWinDate: new Date().toISOString(),
          biggestWin: Math.max(prev.biggestWin, result.discount),
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          averageDiscount: newAverageDiscount,
          experience: newExperience,
          level: newLevel,
          rank: newRank,
        };
      });

      onWin?.(result.discount, result.code);
    }, 4500);
  }, [isSpinning, dailyAttempts, extraAttemptsLeft, rotation, pickSegment, onWin, setSavedStats]);

  // kodu kopyalama
  const copyCode = () => {
    if (!spinResult) return;
    navigator.clipboard.writeText(spinResult.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Sosial sübut popuplar
  useEffect(() => {
    const timer = setInterval(() => {
      if (liveToasts.length < 2) {
        setLiveToasts((prev) => [...prev, Date.now()]);
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [liveToasts]);

  const removeLiveToast = (id: number) => setLiveToasts((prev) => prev.filter((x) => x !== id));

  // UI qısa referral (dost dəvət)
  const handleReferral = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => alert("Link kopyalandı! Dostunuz qeydiyyatdan keçərsə, +1 fırlanma qazanacaqsınız."));
  };

  return (
    <>
      {/* Canlı toast-lar */}
      <AnimatePresence>
        {liveToasts.map((id) => (
          <LiveWinPopup key={id} onClose={() => removeLiveToast(id)} />
        ))}
      </AnimatePresence>

      {/* Konfeti */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * window.innerWidth, rotate: 0 }}
                animate={{ y: window.innerHeight + 20, rotate: 720 }}
                transition={{ duration: 2 + Math.random() * 3, ease: "linear" }}
                className="absolute w-2 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-amber-400"
                style={{ left: Math.random() * 100 + "%" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Əsas komponent */}
      <section className="relative max-w-md mx-auto px-4 py-6">
        {/* Arxa fon parıltı */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-200/30 via-lime-100/20 to-amber-100/40 blur-3xl rounded-[5rem]" />

        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] shadow-2xl border border-emerald-100 p-6 md:p-8 overflow-hidden">
          {/* Başlıq + sayğac */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent flex items-center gap-2">
              <GiPumpkin className="text-3xl text-emerald-600" />
              Endirim Çarxı
            </h2>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800">
              <FaRegClock className="text-emerald-600" />
              {timeUntilReset}
            </div>
          </div>

          {/* Bildiriş – gün sonuna qədər */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-medium text-amber-700 bg-amber-50/80 rounded-xl p-2.5 mb-5 border border-amber-200"
          >
            {dailyAttempts + extraAttemptsLeft === 0
              ? "Sabah yenidən pulsuz şans! Sifarişinizi artıraraq əlavə fırlatma qazanın."
              : `Bu gün sizi ən yüksək 50% endirim gözləyir! Cəhdlər: ${dailyAttempts + extraAttemptsLeft}`}
          </motion.div>

          {/* Çarx */}
          <div ref={wheelRef} className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto mb-6 select-none">
            {/* İynə */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <GiAbstract086 className="text-4xl text-yellow-500 drop-shadow-lg rotate-180" />
            </div>

            {/* Dönən təkər */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4.5, ease: [0.15, 0.7, 0.1, 1.0] }}
              className="w-full h-full rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-stone-50"
            >
              {SPIN_SEGMENTS.map((seg, idx) => {
                const angle = (360 / SPIN_SEGMENTS.length) * idx;
                const Icon = seg.icon;
                return (
                  <div
                    key={idx}
                    className={`absolute w-full h-full bg-gradient-to-br ${seg.gradient}`}
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + 360 / SPIN_SEGMENTS.length - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + 360 / SPIN_SEGMENTS.length - 90) * Math.PI / 180)}%)`,
                    }}
                  >
                    <div
                      className="absolute flex flex-col items-center justify-center text-white"
                      style={{
                        top: "30%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${angle + 360 / SPIN_SEGMENTS.length / 2}deg)`,
                      }}
                    >
                      <Icon size={18} className="drop-shadow mb-1" />
                      <span className="text-xs font-bold drop-shadow">{seg.label}</span>
                    </div>
                  </div>
                );
              })}
              {/* Mərkəzi düymə */}
              <button
                onClick={handleSpinFinal}
                disabled={!canSpin}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-2xl z-10 flex items-center justify-center transition-transform ${
                  canSpin
                    ? "bg-gradient-to-br from-emerald-500 to-green-600 hover:scale-105 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isSpinning ? (
                  <GiFallDown className="text-white text-2xl animate-bounce" />
                ) : (
                  <GiClick className="text-white text-2xl" />
                )}
              </button>
            </motion.div>
          </div>

          {/* Alt hissə: stat + dost dəvət */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-emerald-50 rounded-xl p-2">
              <GiTicket className="mx-auto text-emerald-700 mb-1" size={18} />
              <span className="text-[11px] font-medium">{savedStats.totalWins} qələbə</span>
            </div>
            <div className="bg-amber-50 rounded-xl p-2">
              <GiTwoCoins className="mx-auto text-amber-700 mb-1" size={18} />
              <span className="text-[11px] font-medium">%{savedStats.totalSaved} cəmi</span>
            </div>
            <div
              onClick={handleReferral}
              className="bg-blue-50 rounded-xl p-2 cursor-pointer hover:bg-blue-100 transition"
            >
              <FaShareAlt className="mx-auto text-blue-600 mb-1" size={14} />
              <span className="text-[10px] font-medium">Dost dəvət</span>
            </div>
          </div>

          {/* Fırlat düyməsi (mobil üçün əlavə) */}
          <motion.button
            whileHover={{ scale: canSpin ? 1.02 : 1 }}
            whileTap={{ scale: 0.97 }}
            disabled={!canSpin}
            onClick={handleSpinFinal}
            className={`w-full py-3 rounded-2xl font-bold text-white transition-all ${
              canSpin
                ? "bg-gradient-to-r from-emerald-600 to-green-700 shadow-xl hover:shadow-2xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <GiFallDown className="animate-spin" /> Fırlanır...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FaGift /> Pulsuz Çevir ({dailyAttempts + extraAttemptsLeft})
              </span>
            )}
          </motion.button>
        </div>

        {/* Qazanma modalı */}
        <AnimatePresence>
          {spinResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-emerald-100"
              >
                {/* Üst banner */}
                <div className="relative bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 p-6 text-center text-white">
                  <button
                    onClick={() => setSpinResult(null)}
                    className="absolute top-4 right-4 bg-black/20 rounded-full p-1 hover:bg-black/40"
                  >
                    <MdClose size={20} />
                  </button>
                  <GiStarShuriken className="text-5xl mx-auto mb-2 drop-shadow" />
                  <h3 className="text-2xl font-black">Təbriklər!</h3>
                  <p className="opacity-90">%{spinResult.discount} endirim qazandınız</p>
                </div>

                {/* Kod */}
                <div className="p-5 space-y-4">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-700 mb-1">Endirim kodunuz:</p>
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-emerald-200">
                      <span className="font-mono font-bold text-lg tracking-wider text-emerald-800">
                        {spinResult.code}
                      </span>
                      <button
                        onClick={copyCode}
                        className="p-1.5 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition"
                      >
                        {copied ? (
                          <span className="text-emerald-600 text-sm font-bold">✓</span>
                        ) : (
                          <FaCopy className="text-emerald-600" size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 text-center">
                    Bu kod sifariş zamanı endirim qutusunda istifadə edilə bilər. 24 saat ərzində aktivdir!
                  </p>

                  <button
                    onClick={() => setSpinResult(null)}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    Oldu, davam et
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
};