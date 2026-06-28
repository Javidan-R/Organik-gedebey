// components/FileUpload.tsx
'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onUpload: (url: string) => void
  folder?: string
  accept?: string
  maxSize?: number // MB
}

export function FileUpload({
  onUpload,
  folder = "products",
  accept = "image/*",
  maxSize = 5,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File maksimum ${maxSize}MB ola bilər`)
      return
    }
    
    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    
    // Upload
    setUploading(true)
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
        throw new Error(error.error)
      }
      
      const data = await res.json()
      onUpload(data.url)
    } catch (error) {
      alert('Xəta: ' + error.message)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }
  
  const handleRemove = () => {
    setPreview(null)
    onUpload('')
  }
  
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Şəkil yüklə</span>
              <span className="text-xs text-gray-400 mt-1">Max {maxSize}MB</span>
            </>
          )}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}