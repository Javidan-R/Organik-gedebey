// src/components/admin/organisms/MediaTab.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ImageIcon,
  Link2,
  GripVertical,
  Star,
  Maximize2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import Image from 'next/image';
import { Product, ProductImage } from '@/types/products';
import { cryptoId } from '@/lib/store';
import {
  Input,
  Button,
  Tooltip,
} from '@/components/atoms';

// ─── MediaTab Props ─────────────────────────────────────────────
interface MediaTabProps {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
}

// ─── Təhlükəsiz Şəkil URL-i ────────────────────────────────────
function safeImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholder.png';
  try {
    new URL(url);
    return url;
  } catch {
    return url.startsWith('/') ? url : '/placeholder.png';
  }
}

// ─── Upload Status ──────────────────────────────────────────────
interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

// ─── Main MediaTab Component ──────────────────────────────────
export function MediaTab({ product, setProduct }: MediaTabProps) {
  const images = (product.images as ProductImage[]) ?? [];
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Normalize images with fallback
  const normalizedImages: ProductImage[] = images.map((img) => ({
    id: img.id ?? cryptoId(),
    url: img.url ?? '',
    alt: img.alt ?? '',
    source: img.source ?? 'url',
    displayOrder: img.displayOrder ?? 0,
  }));

  const updateImages = useCallback(
    (next: ProductImage[]) => {
      setProduct((s) => ({
        ...s,
        images: next,
      }));
    },
    [setProduct]
  );

  // ─── Link ilə əlavə ──────────────────────────────────────────
  const handleAddUrlImage = useCallback(() => {
    const url = urlInput.trim();
    if (!url) {
      setError('Zəhmət olmasa etibarlı URL daxil edin');
      return;
    }
    try {
      new URL(url);
    } catch {
      setError('Etibarsız URL formatı');
      return;
    }

    const newImage: ProductImage = {
      id: cryptoId(),
      url,
      alt: '',
      source: 'url',
      displayOrder: normalizedImages.length,
    };
    updateImages([...normalizedImages, newImage]);
    setUrlInput('');
    setError(null);
  }, [urlInput, normalizedImages, updateImages]);

  // ─── Fayl yükləmə ────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setIsUploading(true);
      setError(null);

      const fileArray = Array.from(files);
      const newUploadStatuses: UploadStatus[] = fileArray.map((file) => ({
        id: cryptoId(),
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      }));
      setUploadStatuses((prev) => [...prev, ...newUploadStatuses]);

      const created: ProductImage[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const statusId = newUploadStatuses[i]?.id;

        // Əgər file undefined-dırsa, keç
        if (!file || !statusId) continue;

        try {
          const formData = new FormData();
          formData.append('file', file);

          const xhr = new XMLHttpRequest();
          const uploadPromise = new Promise<string>((resolve, reject) => {
            xhr.open('POST', '/api/upload');
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setUploadStatuses((prev) =>
                  prev.map((s) =>
                    s.id === statusId ? { ...s, progress } : s
                  )
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.url);
              } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
          });

          const url = await uploadPromise;

          created.push({
            id: cryptoId(),
            url,
            alt: file.name.replace(/\.[^/.]+$/, ''),
            source: 'upload',
            displayOrder: normalizedImages.length + created.length,
          });

          setUploadStatuses((prev) =>
            prev.map((s) =>
              s.id === statusId ? { ...s, status: 'done', progress: 100, url } : s
            )
          );
        } catch (err) {
          console.error('Upload error:', err);
          setUploadStatuses((prev) =>
            prev.map((s) =>
              s.id === statusId ? { ...s, status: 'error' } : s
            )
          );
          setError(`Şəkil yüklənərkən xəta: ${file.name}`);
        }
      }

      if (created.length > 0) {
        updateImages([...normalizedImages, ...created]);
      }

      // 3 saniyə sonra status mesajlarını təmizlə
      setTimeout(() => {
        setUploadStatuses([]);
      }, 3000);

      setIsUploading(false);
    },
    [normalizedImages, updateImages]
  );

  // ─── Drag & Drop ──────────────────────────────────────────────
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(normalizedImages);
      const [removed] = items.splice(result.source.index, 1);
      // removed undefined ola bilər, yoxlayaq
      if (!removed) return;
      items.splice(result.destination.index, 0, removed);
      const reordered = items.map((img, idx) => ({
        ...img,
        displayOrder: idx,
      }));
      updateImages(reordered);
    },
    [normalizedImages, updateImages]
  );

  // ─── Alt text dəyiş ──────────────────────────────────────────
  const handleAltChange = useCallback(
    (id: string, alt: string) => {
      const next = normalizedImages.map((img) =>
        img.id === id ? { ...img, alt } : img
      );
      updateImages(next);
    },
    [normalizedImages, updateImages]
  );

  // ─── Auto-generate alt texts ────────────────────────────────
  const handleAutoGenerateAlt = useCallback(() => {
    const productName = product.name || 'Məhsul';
    const updated = normalizedImages.map((img, idx) => ({
      ...img,
      alt: `${productName} - şəkil ${idx + 1}`,
    }));
    updateImages(updated);
  }, [product.name, normalizedImages, updateImages]);

  // ─── Sil ──────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: string) => {
      const next = normalizedImages.filter((img) => img.id !== id);
      updateImages(next);
    },
    [normalizedImages, updateImages]
  );

  // ─── Əsas şəkil seç ──────────────────────────────────────────
  const handleSetPrimary = useCallback(
    (id: string) => {
      const idx = normalizedImages.findIndex((img) => img.id === id);
      if (idx <= 0) return;
      const copy = [...normalizedImages];
      const [item] = copy.splice(idx, 1);
      if (!item) return;
      copy.unshift(item);
      const reordered = copy.map((img, i) => ({
        ...img,
        displayOrder: i,
      }));
      updateImages(reordered);
    },
    [normalizedImages, updateImages]
  );

  // ─── Preview ──────────────────────────────────────────────────
  const handlePreview = (img: ProductImage | undefined) => {
    if (img) setPreviewImage(img);
  };

  // ─── Xəta mesajını avtomatik təmizlə ──────────────────────
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Xəta mesajı */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="h-5 w-5" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Status Bar */}
      <AnimatePresence>
        {uploadStatuses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 overflow-hidden"
          >
            {uploadStatuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                {status.status === 'uploading' && (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <span className="font-medium text-slate-700">
                      {status.fileName}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                    <span className="text-slate-500">{status.progress}%</span>
                  </>
                )}
                {status.status === 'done' && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-slate-700">
                      {status.fileName}
                    </span>
                    <span className="text-emerald-600">✔ Yükləndi</span>
                  </>
                )}
                {status.status === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-600">
                      {status.fileName} - yüklənmədi
                    </span>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-200 transition-colors">
          <Camera className="h-4 w-4" />
          <span>Kameradan çək</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-200 transition-colors">
          <ImageIcon className="h-4 w-4" />
          <span>Qalereyadan seç</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </label>

        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <div className="relative flex-1">
            <Input
              name="media-url-input"
              value={urlInput}
              onChange={(val) => setUrlInput(val)}
              placeholder="https://... link ilə şəkil əlavə et"
              icon={<Link2 className="h-4 w-4" />}
              onKeyDown={(e: { key: string; }) => e.key === 'Enter' && handleAddUrlImage()}
              className="border-2"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddUrlImage}
            disabled={!urlInput.trim()}
          >
            <ImageIcon className="h-4 w-4" />
            Əlavə et
          </Button>
        </div>

        {normalizedImages.length > 0 && (
          <Tooltip content="Bütün şəkillər üçün alt mətni avtomatik yarat">
            <Button
              variant="soft"
              size="sm"
              onClick={handleAutoGenerateAlt}
            >
              ✨ Alt mətn yarat
            </Button>
          </Tooltip>
        )}
      </div>

      {/* No Images State */}
      {normalizedImages.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-xs text-slate-500">
          <ImageIcon className="mx-auto mb-2 h-12 w-12 text-slate-300" />
          <p>Hələ şəkil əlavə edilməyib.</p>
          <p className="text-[11px]">Kameradan çəkə, qalereyadan seçə və ya link ilə şəkil əlavə edə bilərsiniz.</p>
        </div>
      )}

      {/* Grid */}
      {normalizedImages.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="product-images" direction="horizontal">
            {(provided, snapshot) => (
              <div
                className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-emerald-50/50 rounded-2xl p-1' : ''
                }`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {normalizedImages.map((img, index) => (
                  <Draggable key={img.id} draggableId={img.id!} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative space-y-2 rounded-2xl border bg-white p-2 shadow-sm transition-all duration-200 ${
                          snapshot.isDragging
                            ? 'border-emerald-400 ring-2 ring-emerald-200 shadow-xl scale-105'
                            : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-2 top-2 flex cursor-grab items-center rounded-full bg-black/30 px-1 py-0.5 text-[10px] text-white backdrop-blur-sm z-10"
                        >
                          <GripVertical className="mr-1 h-3 w-3" />
                          {index + 1}
                        </div>

                        {/* Image Preview */}
                        <div
                          className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100 group"
                          onClick={() => handlePreview(img)}
                        >
                          <Image
                            src={safeImageUrl(img.url)}
                            alt={img.alt || `Məhsul şəkli ${index + 1}`}
                            fill
                            sizes="240px"
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png';
                            }}
                          />
                          {index === 0 && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                              <Star className="h-3 w-3" />
                              Əsas
                            </span>
                          )}
                          <button
                            type="button"
                            className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Maximize2 className="h-3 w-3" />
                            Böyüt
                          </button>
                        </div>

                        {/* Alt Text Input – size prop-u yoxdur, className ilə tənzimlənir */}
                        <Input
                          name={`alt-${img.id}`}
                          value={img.alt || ''}
                          onChange={(val) => handleAltChange(img.id!, val)}
                          placeholder="Alt mətni (SEO)"
                          className="text-[11px] border-2 py-1.5 px-3"
                        />

                        {/* Actions */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                            {img.source === 'upload' ? '⬆ Yüklənib' : '🔗 Link'}
                          </span>
                          <div className="flex items-center gap-1">
                            {index > 0 && (
                              <Tooltip content="Əsas şəkil et">
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(img.id!)}
                                  className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  ⭐ Əsas et
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip content="Şəkli sil">
                              <button
                                type="button"
                                onClick={() => handleDelete(img.id!)}
                                className="rounded-full bg-red-50 p-1 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Video URL (atoms ilə) */}
      <div className="mt-4 border-t border-slate-200 pt-4">
        <Input
          label="Video URL (opsional)"
          name="video-url"
          value={product.video || ''}
          onChange={(val) =>
            setProduct((s) => ({ ...s, video: val || undefined }))
          }
          placeholder="https://youtube.com/..."
          icon={<ImageIcon className="h-4 w-4" />}
          className="border-2"
          helper="YouTube, Vimeo və ya digər platformadan video əlavə edin."
        />
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={safeImageUrl(previewImage.url)}
                alt={previewImage.alt || 'Preview'}
                width={1600}
                height={1200}
                className="h-full w-full object-contain"
                priority
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
              >
                ✕ Bağla
              </button>
              {previewImage.alt && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white backdrop-blur-sm">
                  {previewImage.alt}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MediaTab;