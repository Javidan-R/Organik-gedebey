import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Product } from "@/types/products"
import { getFirstImageUrl, formatCurrency, getProductBasePrice } from "@/utils/storefront_home"
import { AnimatePresence, motion } from "framer-motion"
import { Search, X, ChevronRight } from "lucide-react"
import { FC, useState, useMemo } from "react"




// NEW: Mobile Search Drawer
export const MobileSearchDrawer: FC<{
  isOpen: boolean
  onClose: () => void
  products: Product[]
}> = ({ isOpen, onClose, products }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('og-recent-searches', [])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return []
    return products
      .filter(p => !p.archived && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
      .slice(0, 6)
  }, [searchTerm, products])

  const handleSearch = (term: string) => {
    if (term && !recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches].slice(0, 5))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl rounded-b-3xl shadow-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(searchTerm)}
                  placeholder="Məhsul axtar..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 outline-none text-sm"
                  autoFocus
                />
              </div>
              <button onClick={onClose} className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!searchTerm && recentSearches.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Son axtarışlar</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <button
                      key={s}
                      onClick={() => setSearchTerm(s)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredProducts.map((product, i) => (
                  <motion.a
                    key={product.id}
                    href={`/products/${product.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img src={getFirstImageUrl(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-emerald-600 font-bold">{formatCurrency(getProductBasePrice(product))}</p>
                      {product.originRegion && <p className="text-[10px] text-slate-400">📍 {product.originRegion}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </motion.a>
                ))}
              </div>
            )}

            {searchTerm && filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <span className="text-4xl">🔍</span>
                <p className="text-slate-500 text-sm mt-2">`{searchTerm}` üçün nəticə tapılmadı</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
