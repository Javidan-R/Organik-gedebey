// app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useAuth, useRedirectIfAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, Loader2, Shield, Package,
  Truck, User, ArrowRight, Sparkles, AlertTriangle
} from 'lucide-react'

const roles = [
  {
    id: 'admin',
    name: 'Admin',
    icon: Shield,
    color: 'from-purple-600 to-indigo-600',
    description: 'Tam idarəetmə paneli',
  },
  {
    id: 'delivery',
    name: 'Delivery',
    icon: Truck,
    color: 'from-blue-600 to-cyan-600',
    description: 'Çatdırılma idarəetməsi',
  },
  {
    id: 'vendor',
    name: 'Satıcı',
    icon: Package,
    color: 'from-emerald-600 to-teal-600',
    description: 'Məhsul və stok idarəsi',
  },
]

export default function AdminLoginPage() {
  useRedirectIfAuth('/admin/dashboard')

  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentRole = roles.find(r => r.id === selectedRole)!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password, selectedRole)
      
      // Redirect based on role
      if (selectedRole === 'delivery') {
        window.location.href = '/delivery/dashboard'
      } else if (selectedRole === 'vendor') {
        window.location.href = '/vendor/dashboard'
      } else {
        window.location.href = '/admin/dashboard'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br ${currentRole.color} rounded-full blur-3xl opacity-30`}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-600 to-rose-600 rounded-full blur-3xl opacity-20"
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <Link href="/" className="inline-block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center justify-center gap-3 text-white mb-4"
              >
                <Sparkles className="w-10 h-10" />
                <span className="text-3xl font-bold">Organik Gədəbəy</span>
              </motion.div>
            </Link>
            <p className="text-slate-400">İdarəetmə Paneli</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Role Selection Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Giriş növü</h3>
                <div className="space-y-3">
                  {roles.map((role) => {
                    const RoleIcon = role.icon
                    return (
                      <motion.button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 rounded-2xl border-2 transition-all ${
                          selectedRole === role.id
                            ? `border-white/30 bg-gradient-to-br ${role.color} shadow-xl`
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedRole === role.id
                              ? 'bg-white/20'
                              : 'bg-white/10'
                          }`}>
                            <RoleIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-bold text-white">{role.name}</p>
                            <p className={`text-sm ${
                              selectedRole === role.id
                                ? 'text-white/80'
                                : 'text-slate-400'
                            }`}>
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Demo Giriş:</p>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <p>admin@organikgedebey.az</p>
                    <p>delivery@organikgedebey.az</p>
                    <p>vendor@organikgedebey.az</p>
                    <p className="text-slate-500">şifrə: (role)123</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                <div className="mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${currentRole.color} mb-4`}>
                    <currentRole.icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentRole.name} Girişi
                  </h2>
                  <p className="text-slate-400">{currentRole.description}</p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                    >
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="sizin@email.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-white/20 focus:border-white/20 outline-none transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Şifrə
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-white/20 focus:border-white/20 outline-none transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${currentRole.color} text-white font-semibold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Giriş edilir...</span>
                      </>
                    ) : (
                      <>
                        <span>Daxil ol</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                  <Link
                    href="/"
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    ← Ana səhifəyə qayıt
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}