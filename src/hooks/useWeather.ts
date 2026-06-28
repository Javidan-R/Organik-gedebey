import { WEATHER_SUGGESTIONS } from "@/const"
import { WeatherData } from "@/types/home"
import { useState } from "react"

export function useWeather(): WeatherData {
  const [weather] = useState<WeatherData>(() => {
    const conditions = Object.keys(WEATHER_SUGGESTIONS) as (keyof typeof WEATHER_SUGGESTIONS)[]
    const key = conditions[Math.floor(Math.random() * conditions.length)]
    return WEATHER_SUGGESTIONS[key]
  })
  return weather
}