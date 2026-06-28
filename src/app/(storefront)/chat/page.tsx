'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, X, Minimize2, Maximize2, Phone, Clock, Check, CheckCheck } from 'lucide-react'
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
  icon?: string
}

const QUICK_REPLIES: QuickReply[] = [
  { text: 'Məhsullar haqqında məlumat', icon: '📦' },
  { text: 'Çatdırılma və ödəniş', icon: '🚚' },
  { text: 'Sifariş statusu', icon: '📋' },
  { text: 'Əlaqə', icon: '📞' },
]

export default function Chat() {
  const { sendChat } = useApp()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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

    // Simulate bot response with delay
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
      
      // Update user message status to delivered
      setMessages(prev => prev.map(m => 
        m.id === userMsg.id ? { ...m, status: 'delivered' } : m
      ))
    }, 1000 + Math.random() * 1000)
  }

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Simple keyword-based responses
    if (lowerMessage.includes('məhsul') || lowerMessage.includes('mal')) {
      return 'Məhsullarımız haqqında məlumat üçün kataloq bölməsinə keçə bilərsiniz. Hansı məhsul maraqlandırır? 🌿'
    }
    if (lowerMessage.includes('çatdırılma') || lowerMessage.includes('catdirilma')) {
      return 'Çatdırılma Gədəbəy daxilində pulsuzdur. Başqa bölgələrə çatdırılma müddəti 2-3 gündür. 🚚'
    }
    if (lowerMessage.includes('ödəniş') || lowerMessage.includes('odenis')) {
      return 'Ödəniş karta nağd və ya online şəkildə edilə bilər. 💳'
    }
    if (lowerMessage.includes('sifariş') || lowerMessage.includes('sifaris')) {
      return 'Sifarişinizi izləmək üçün hesabınıza daxil olun və "Sifarişlərim" bölməsinə keçin. 📋'
    }
    if (lowerMessage.includes('qiymət') || lowerMessage.includes('price') || lowerMessage.includes('narx')) {
      return 'Qiymətlərimiz bazar qiymətlərindən aşağıdır. Xüsusi endirimlər üçün WhatsApp vasitəsilə əlaqə saxlayın. 💰'
    }
    if (lowerMessage.includes('salam') || lowerMessage.includes('hey')) {
      return 'Salam! Gədəbəy təbii məhsulları mağazasına xoş gəldiniz! Sizə necə kömək edə bilərik? 🌱'
    }
    
    // Default response
    return 'Sualınızı qəbul etdim. Qısa zamanda sizinlə əlaqə saxlanılacaq. Daha tez cavab üçün WhatsApp vasitəsilə yazın. 🌿'
  }

  const handleQuickReply = (reply: string) => {
    setText(reply)
    handleSend()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          1
        </span>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Gədəbəy Dəstək</h3>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 h-[calc(600px-180px)]">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 mb-2">Salam! 👋</p>
                <p className="text-sm text-gray-500">Sizə necə kömək edə bilərik?</p>
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
                  <div className={`max-w-[80%] ${
                    m.from === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm'
                  }`}>
                    <p className="px-4 py-3 text-sm">{m.text}</p>
                    <div className={`flex items-center gap-1 px-3 pb-2 text-xs ${
                      m.from === 'user' ? 'text-white/80 justify-end' : 'text-gray-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {formatTime(m.createdAt)}
                      {m.from === 'user' && m.status && (
                        <>
                          {m.status === 'sent' && <Check className="w-3 h-3" />}
                          {m.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                          {m.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-300" />}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((reply, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleQuickReply(reply.text)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {reply.icon && <span className="mr-1">{reply.icon}</span>}
                    {reply.text}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <textarea
                className="flex-1 resize-none border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Mesajınızı yazın..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!text.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <a
                href={whatsappLink('9944775878588', 'Salam, mən saytdən yazıram')}
                target="blank"
                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                WhatsApp ilə əlaqə
              </a>
              <p className="text-xs text-gray-400">Enter ilə göndər</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
