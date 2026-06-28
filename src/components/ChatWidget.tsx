'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, X, Minimize2, Maximize2, Phone, Clock, Check, CheckCheck, Bot, Sparkles, Package, Truck, FileText, Headphones } from 'lucide-react'
import { whatsappLink } from '@/lib/whatsapp'

interface Message {
  id: string
  text: string
  from: 'user' | 'bot'
  createdAt: string
  status?: 'sent' | 'delivered' | 'read'
}

interface QuickReply {
  text: string
  icon: React.ReactNode
  action: string
}

const QUICK_REPLIES: QuickReply[] = [
  { text: 'Məhsullar', icon: <Package className="w-4 h-4" />, action: 'products' },
  { text: 'Çatdırılma', icon: <Truck className="w-4 h-4" />, action: 'delivery' },
  { text: 'Sifariş', icon: <FileText className="w-4 h-4" />, action: 'orders' },
  { text: 'Əlaqə', icon: <Headphones className="w-4 h-4" />, action: 'contact' },
]

export default function ChatWidget() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const handleSend = async () => {
    if (!text.trim()) return
    const userMsg: Message = {
      id: crypto.randomUUID(),
      text,
      from: 'user',
      createdAt: new Date().toISOString(),
      status: 'sent',
    }
    setMessages(prev => [...prev, userMsg])
    setText('')
    setIsTyping(true)

    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMsg.text)
      const botMsg: Message = {
        id: crypto.randomUUID(),
        text: botResponse,
        from: 'bot',
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: 'delivered' } : m))
    }, 1000 + Math.random() * 1000)
  }

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const lower = userMessage.toLowerCase()
    if (lower.includes('məhsul') || lower.includes('mal')) return 'Məhsullarımız haqqında kataloq bölməsinə keçə bilərsiniz. Hansı məhsul maraqlandırır? 🌿'
    if (lower.includes('çatdırılma')) return 'Gədəbəy daxilində pulsuz çatdırılma. Digər bölgələrə 2-3 gün. 🚚'
    if (lower.includes('ödəniş')) return 'Kartla online, nağd və bank köçürməsi qəbul edilir. 💳'
    if (lower.includes('sifariş')) return 'Sifarişinizi izləmək üçün hesabınıza daxil olun. 📋'
    if (lower.includes('qiymət') || lower.includes('narx')) return 'Qiymətlərimiz bazar qiymətlərindən aşağıdır. WhatsApp ilə əlaqə saxlayın. 💰'
    if (lower.includes('salam')) return 'Salam! Gədəbəy təbii məhsulları mağazasına xoş gəldiniz! 🌱'
    return 'Sualınızı qəbul etdim. Daha tez cavab üçün WhatsApp vasitəsilə yazın. 🌿'
  }

  const handleQuickReply = (reply: string) => {
    setText(reply)
    handleSend()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 md:p-4 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all ${
        isMinimized ? 'w-72 md:w-80 h-14' : 'w-[calc(100%-2rem)] md:w-96 h-[calc(100vh-8rem)] md:h-[600px]'
      }`}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base">Gədəbəy Dəstək</h3>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/20 rounded transition-colors">
            {isMinimized ? <Maximize2 className="w-3 h-3 md:w-4 md:h-4" /> : <Minimize2 className="w-3 h-3 md:w-4 md:h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50 h-[calc(100%-140px)]">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 md:py-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                </div>
                <p className="text-gray-600 text-sm md:text-base mb-1 md:mb-2">Salam! 👋</p>
                <p className="text-xs md:text-sm text-gray-500">Sizə necə kömək edə bilərik?</p>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[80%] ${
                    m.from === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm'
                  }`}>
                    <p className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm">{m.text}</p>
                    <div className={`flex items-center gap-1 px-2 md:px-3 pb-1 md:pb-2 text-[10px] md:text-xs ${
                      m.from === 'user' ? 'text-white/80 justify-end' : 'text-gray-400'
                    }`}>
                      <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      {formatTime(m.createdAt)}
                      {m.from === 'user' && m.status && (
                        <>
                          {m.status === 'sent' && <Check className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                          {m.status === 'delivered' && <CheckCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md shadow-sm px-3 md:px-4 py-2 md:py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="px-3 md:px-4 pb-2">
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {QUICK_REPLIES.map((reply, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleQuickReply(reply.text)}
                    className="px-2 py-1.5 md:px-3 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs md:text-sm text-gray-700 transition-colors flex items-center gap-1"
                  >
                    {reply.icon}
                    {reply.text}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 md:p-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <textarea
                className="flex-1 resize-none border rounded-xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Mesajınızı yazın..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={1}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!text.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2 md:p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <a
                href={whatsappLink('9944775878588', 'Salam, mən saytdən yazıram')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-green-600 hover:text-green-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">WhatsApp ilə əlaqə</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
              <p className="text-[10px] md:text-xs text-gray-400">Enter ilə göndər</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
