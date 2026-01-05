'use client'
import { useEffect, useState } from 'react'
export function useToast() {
const [msg, setMsg] = useState<string>('')
useEffect(()=>{ if (!msg) return; const t = setTimeout(()=> setMsg(''), 2200); return ()=>clearTimeout(t) },[msg])
return {
show: (m:string)=> setMsg(m),
Toast: () => msg ? (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-black text-white px-4 py-2 shadow-lg">{msg}</div>) : null
}
}