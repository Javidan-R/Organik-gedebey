'use client'

import { useApp } from '@/lib/store'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Chat() {
  const { sendChat } = useApp()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<
    { id: string; text: string; from: 'user' | 'bot'; createdAt: string }[]
  >([])

  const handleSend = () => {
    if (!text.trim()) return
    const msg = { id: crypto.randomUUID(), text, from: 'user', createdAt: new Date().toISOString() }
    setText('')
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: 'Təşəkkürlər! Qısa zamanda sizinlə əlaqə saxlanılacaq 🌿',
          from: 'bot',
          createdAt: new Date().toISOString(),
        },
      ])
    }, 800)
  }

  return (
    <main className="max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-800 text-center">💬 Gədəbəy Chat</h1>
      <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 h-[65vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[80%] px-4 py-2 rounded-xl ${
                m.from === 'user'
                  ? 'bg-green-100 ml-auto text-right text-green-900'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {m.text}
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <textarea
            className="flex-1 h-12 rounded-xl border px-3 py-2 text-sm"
            placeholder="Mesajınızı yazın..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="h-12 rounded-xl bg-green-600 px-4 text-white"
          >
            Göndər
          </motion.button>
          <a
            href="https://wa.me/9944775878588"
            target="_blank"
            className="h-12 rounded-xl bg-emerald-700 px-4 flex items-center justify-center text-white"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}
