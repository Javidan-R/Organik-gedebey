export const ls = {
get<T>(key: string, fallback: T): T {
if (typeof window === 'undefined') return fallback
try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
},
set<T>(key: string, value: T) { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value)) }
}


export const exportJSON = (obj: unknown, filename: string) => {
const data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2))
const a = document.createElement('a'); a.href = data; a.download = filename; a.click()
}