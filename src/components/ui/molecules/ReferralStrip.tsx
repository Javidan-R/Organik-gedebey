// import { motion } from "framer-motion"
// import { Gift, CheckCircle2, Send, Share2 } from "lucide-react"
// import { useCallback, useState } from "react"
// export function ReferralStrip() {
//   const [email, setEmail] = useState("")
//   const [sent, setSent] = useState(false)
//   const [referralCount, setReferralCount] = useLocalStorageState("og-referrals", 0)
//   const [copied, setCopied] = useState(false)

//   const referralCode = "MENINKODUM" // mock
//   const progress = Math.min((referralCount / 5) * 100, 100)
//   const reward = referralCount >= 5 ? "🎁 30 AZN bonus qazandın!" : `${5 - referralCount} dost qalıb – 30 AZN bonus!`

//   const handleSubmit = () => {
//     if (!email) return
//     setSent(true)
//     setReferralCount((prev: number) => Math.min(prev + 1, 10))
//     setTimeout(() => { setSent(false); setEmail("") }, 2500)
//   }

//   const handleCopyLink = () => {
//     navigator.clipboard?.writeText(`https://organikgedebey.az?ref=${referralCode}`)
//     setCopied(true)
//     setTimeout(() => setCopied(false), 2500)
//   }

//   return (
//     <motion.section
//       initial={{ opacity: 0, y: 16 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-5 shadow-sm overflow-hidden relative md:p-6"
//     >
//       {/* Animated blobs */}
//       <motion.div
//         animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
//         transition={{ repeat: Infinity, duration: 6 }}
//         className="absolute top-0 right-0 w-40 h-40 rounded-full bg-purple-300/40 blur-3xl pointer-events-none"
//       />
//       <motion.div
//         animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
//         transition={{ repeat: Infinity, duration: 8, delay: 2 }}
//         className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-400/30 blur-2xl pointer-events-none"
//       />

//       <div className="relative space-y-4">
//         {/* Header */}
//         <div className="flex items-start gap-3">
//           <motion.div
//             animate={{ rotate: [0, 15, -10, 0] }}
//             transition={{ repeat: Infinity, duration: 4 }}
//             className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shrink-0"
//           >
//             <Gift className="w-6 h-6 text-white" />
//           </motion.div>
//           <div>
//             <p className="text-sm font-black text-purple-900">Dostunu dəvət et – birlikdə qazan! 🎉</p>
//             <p className="text-xs text-purple-600 mt-0.5">
//               Dostun ilk sifarişindən sonra hər ikiniz <span className="font-black">15 AZN bonus</span> alırsınız
//             </p>
//           </div>
//         </div>

//         {/* Progress */}
//         <div className="rounded-2xl bg-white/70 p-3 space-y-2">
//           <div className="flex items-center justify-between text-xs">
//             <span className="font-semibold text-purple-700">{referralCount}/5 dost dəvət edilib</span>
//             <span className="font-black text-purple-600">{reward}</span>
//           </div>
//           <div className="h-2.5 rounded-full bg-purple-100 overflow-hidden">
//             <motion.div
//               initial={{ width: 0 }}
//               animate={{ width: `${progress}%` }}
//               transition={{ duration: 1, ease: "easeOut" }}
//               className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
//             />
//           </div>
//           <div className="flex gap-2">
//             {[1, 2, 3, 4, 5].map(i => (
//               <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= referralCount ? "bg-purple-500" : "bg-purple-100"}`} />
//             ))}
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//           <div className="flex gap-2">
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               onKeyDown={e => e.key === "Enter" && handleSubmit()}
//               placeholder="Dostunun emaili..."
//               className="flex-1 px-3 py-2.5 rounded-2xl border-2 border-purple-200 focus:border-purple-500 outline-none text-xs bg-white transition-colors"
//             />
//             <motion.button
//               whileHover={{ scale: 1.04 }}
//               whileTap={{ scale: 0.97 }}
//               onClick={handleSubmit}
//               className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-bold shadow-lg"
//             >
//               {sent ? <><CheckCircle2 className="w-4 h-4" /> Göndərildi!</> : <><Send className="w-4 h-4" /> Göndər</>}
//             </motion.button>
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.97 }}
//             onClick={handleCopyLink}
//             className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-purple-300 text-purple-700 text-xs font-bold bg-white hover:bg-purple-50 transition-colors"
//           >
//             {copied ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Link kopyalandı!</> : <><Share2 className="w-4 h-4" /> Referans linkini kopyala</>}
//           </motion.button>
//         </div>
//       </div>
//     </motion.section>
//   )
// }
