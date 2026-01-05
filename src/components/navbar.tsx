'use client'
import Link from 'next/link'
import { useApp } from '../lib/store'


export const Navbar = () => {
const cart = useApp(s=>s.cart)
const count = cart.reduce((s,c)=>s+c.qty,0)
return (
<header className="bg-white border-b">
<div className="container-page h-16 flex items-center justify-between gap-4">
<Link href="/" className="font-bold text-brand-700 text-xl">🌿 Organik Gədəbəy</Link>
<nav className="flex items-center gap-4 text-sm">
<Link href="/products">Məhsullar</Link>
<Link href="/chat">Chat</Link>
<Link href="/cart" className="relative">Səbət{count>0 && (<span className="ml-1 rounded-full bg-brand-600 px-2 py-0.5 text-white text-xs">{count}</span>)}</Link>
<Link href="/admin" className="font-medium">Admin</Link>
</nav>
</div>
</header>
)
}
export default Navbar