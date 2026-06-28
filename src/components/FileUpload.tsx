'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, FileText, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
  onUpload: (url: string, publicId?: string) => void
  onDelete?: (publicId: string) => void
  folder?: string
  accept?: string
  maxSize?: number // MB
  multiple?: boolean
  maxFiles?: number
  existingImages?: { url: string; publicId: string }[]
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  publicId?: string
  error?: string
}

export function FileUpload({
  onUpload,
  onDelete,
  folder = "products",
  accept = "image/*",
  maxSize = 10,
  multiple = false,
  maxFiles = 5,
  existingImages = [],
}: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState<{ url: string; publicId: string }[]>(existingImages)

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `Fayl maksimum ${maxSize}MB ola bilər` }
    }
    
    const allowedTypes = accept.split(',').map(t => t.trim())
    if (!allowedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
      return { valid: false, error: 'Dəstəklənməyən fayl növü' }
    }
    
    return { valid: true }
  }, [maxSize, accept])

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setUploads(prev => [...prev, { file, progress: 0, status: 'error', error: validation.error }])
      return
    }

    const uploadId = crypto.randomUUID()
    setUploads(prev => [...prev, { file, progress: 0, status: 'uploading', uploadId }])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Yükləmə xətası')
      }

      const data = await res.json()
      setUploads(prev => prev.map(u => 
        u.file === file ? { ...u, progress: 100, status: 'success', url: data.url, publicId: data.publicId } : u
      ))
      
      setPreviews(prev => [...prev, { url: data.url, publicId: data.publicId }])
      onUpload(data.url, data.publicId)
    } catch (error: any) {
      setUploads(prev => prev.map(u => 
        u.file === file ? { ...u, status: 'error', error: error.message } : u
      ))
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const remainingSlots = maxFiles - previews.length - uploads.filter(u => u.status === 'uploading').length
    
    if (fileArray.length > remainingSlots) {
      alert(`Maksimum ${maxFiles} fayl yükləyə bilərsiniz. ${remainingSlots} yer qaldı.`)
      return
    }

    fileArray.forEach(handleFileUpload)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleRemove = async (publicId: string) => {
    try {
      if (onDelete) {
        await onDelete(publicId)
      }
      
      // Delete from Cloudinary
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      })
      
      setPreviews(prev => prev.filter(p => p.publicId !== publicId))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Fayl silinə bilmədi')
    }
  }

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-all ${
          isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {multiple ? 'Faylları buraya sürükləyin' : 'Faylı buraya sürükləyin'}
          </p>
          <p className="text-sm text-gray-500 mb-4">və ya seçin</p>
          <span className="text-xs text-gray-400">
            Max {maxSize}MB • {multiple ? `Maksimum ${maxFiles} fayl` : 'Tək fayl'}
          </span>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={previews.length >= maxFiles}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploads.map((upload, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            {getFileIcon(upload.file)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {upload.status === 'uploading' && (
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${upload.progress}%` }}
                      className="h-full bg-green-500"
                    />
                  </div>
                )}
                {upload.status === 'success' && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Uğurla yükləndi
                  </span>
                )}
                {upload.status === 'error' && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {upload.error}
                  </span>
                )}
              </div>
            </div>
            {upload.status === 'uploading' && (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            )}
            {(upload.status === 'error' || upload.status === 'success') && (
              <button
                onClick={() => removeUpload(upload.file)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, idx) => (
              <motion.div
                key={preview.publicId || idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <img
                  src={preview.url}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemove(preview.publicId)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}