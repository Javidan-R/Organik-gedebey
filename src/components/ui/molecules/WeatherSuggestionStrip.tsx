import { WeatherData } from "@/types/home"
import { motion } from "framer-motion"
import { Sun, Wind, Droplets } from "lucide-react"
import { FC } from "react"

// NEW: Weather & Suggestion Strip  
export const WeatherSuggestionStrip: FC<{ weather: WeatherData }> = ({ weather }) => {
  const icons = { sunny: Sun, cloudy: Wind, rainy: Droplets, windy: Wind }
  const Icon = icons[weather.condition]
  const colors = {
    sunny: 'from-amber-50 to-orange-50 border-amber-200',
    cloudy: 'from-slate-50 to-blue-50 border-slate-200',
    rainy: 'from-blue-50 to-indigo-50 border-blue-200',
    windy: 'from-cyan-50 to-teal-50 border-cyan-200',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-2xl border bg-linear-to-r ${colors[weather.condition]} px-4 py-3 text-xs`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Icon className="w-5 h-5 text-amber-600" />
        <span className="font-bold text-slate-700">{weather.temp}°C</span>
        <span className="text-slate-500">Bakı</span>
      </div>
      <span className="text-slate-600 text-[11px] leading-relaxed">{weather.suggestion}</span>
    </motion.div>
  )
}