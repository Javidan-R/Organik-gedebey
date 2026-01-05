import { cryptoId } from "@/lib/store";
import { Product, ProductImage } from "@/types/products";
import { DropResult, DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Camera, ImageIcon, Link2, GripVertical, Star, Maximize2, Trash2 } from "lucide-react";
import { useState } from "react";
import { INPUT_BASE } from "../products/ProductEditModal";
import FormGroup from "../../shared/FormGroup";
import Image from 'next/image';

type MediaTabProps = {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
};

export function MediaTab({ product, setProduct }: MediaTabProps) {
  const images = (product.images as ProductImage[]) ?? [];
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);

  // product.images-i normalize edək (köhnə datada id yoxdursa id ver)
  const normalizedImages: ProductImage[] = images.map((img) => ({
    id: img.id ?? cryptoId(),
    url: img.url,
    alt: img.alt ?? '',
    source: img.source ?? 'url',
  }));

  const updateImages = (next: ProductImage[]) => {
    setProduct((s) => ({
      ...s,
      images: next,
    }));
  };

  /* 🔹 1. Link ilə şəkil əlavə etmək */
  const handleAddUrlImage = () => {
    const url = urlInput.trim();
    if (!url) return;

    const newImage: ProductImage = {
      id: cryptoId(),
      url,
      alt: '',
      source: 'url',
    };

    updateImages([...normalizedImages, newImage]);
    setUrlInput('');
  };

  const handleUrlInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrlImage();
    }
  };

  /* 🔹 2. Qalereyadan & kameradan şəkil əlavə (high quality) */
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const created: ProductImage[] = [];

    for (const file of Array.from(files)) {
      // Keyfiyyəti qorumaq üçün file-i birbaşa object URL kimi istifadə edirik
      const url = URL.createObjectURL(file);

      created.push({
        id: cryptoId(),
        url,
        alt: file.name.replace(/\.[^/.]+$/, ''),
        source: 'upload',
      });
    }

    updateImages([...normalizedImages, ...created]);
    setIsUploading(false);
  };

  /* 🔹 3. Drag & Drop reorder */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(normalizedImages);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    updateImages(items);
  };

  /* 🔹 4. Alt text dəyişmək */
  const handleAltChange = (id: string, alt: string) => {
    const next = normalizedImages.map((img) =>
      img.id === id ? { ...img, alt } : img,
    );
    updateImages(next);
  };

  /* 🔹 5. Şəkli silmək */
  const handleDelete = (id: string) => {
    const next = normalizedImages.filter((img) => img.id !== id);
    updateImages(next);
  };

  /* 🔹 6. Əsas şəkil seçmək (ilk sıraya çəkmək) */
  const handleSetPrimary = (id: string) => {
    const idx = normalizedImages.findIndex((img) => img.id === id);
    if (idx <= 0) return;
    const copy = [...normalizedImages];
    const [item] = copy.splice(idx, 1);
    copy.unshift(item);
    updateImages(copy);
  };

  return (
    <div className="space-y-6 rounded-2xl bg-white p-4 shadow-inner">
      {/* Üst panel: kamera + qalereya + URL ilə əlavə */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Kamera ilə şəkil çək */}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-200">
          <Camera className="h-4 w-4" />
          <span>Kameradan çək</span>
          <input
            type="file"
            accept="image/*"
            capture="environment" // Mobil telefonda arxa kamera açılır
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </label>

        {/* Qalereyadan şəkil seç */}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-200">
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

        {/* URL ilə əlavə */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400">
              <Link2 className="h-4 w-4" />
            </span>
            <input
              type="text"
              className={`${INPUT_BASE} pl-8 text-xs`}
              placeholder="https://... link ilə şəkil əlavə et"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleUrlInputKeyDown}
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrlImage}
            className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-black"
          >
            <ImageIcon className="h-3 w-3" />
            Əlavə et
          </button>
        </div>
      </div>

      {isUploading && (
        <p className="text-xs text-emerald-600">Şəkillər yüklənir...</p>
      )}

      {/* Əgər şəkil yoxdursa info kart */}
      {normalizedImages.length === 0 && (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-xs text-gray-500">
          Hələ şəkil əlavə edilməyib. Kameradan çəkə, qalereyadan seçə və ya link
          ilə şəkil əlavə edə bilərsiniz.
        </div>
      )}

      {/* Drag & Drop Grid */}
      {normalizedImages.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="product-images">
            {(provided) => (
              <div
                className="grid grid-cols-2 gap-4 md:grid-cols-4"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {normalizedImages.map((img, index) => (
                  <Draggable key={img.id} draggableId={img.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative space-y-2 rounded-2xl border bg-gray-50 p-2 shadow-sm transition ${
                          snapshot.isDragging
                            ? 'border-emerald-400 ring-2 ring-emerald-200'
                            : ''
                        }`}
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-2 top-2 flex cursor-grab items-center rounded-full bg-black/30 px-1 py-0.5 text-[10px] text-white"
                        >
                          <GripVertical className="mr-1 h-3 w-3" />
                          {index + 1}
                        </div>

                        {/* Şəkil preview */}
                        <div
                          className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100"
                          onClick={() => setPreviewImage(img)}
                        >
                          <Image
                            src={img.url}
                            alt={img.alt || `Məhsul şəkli ${index + 1}`}
                            fill
                            sizes="240px"
                            className="object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                              <Star className="h-3 w-3" />
                              Əsas
                            </span>
                          )}
                          <button
                            type="button"
                            className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white hover:bg-black/70"
                          >
                            <Maximize2 className="h-3 w-3" />
                            Böyüt
                          </button>
                        </div>

                        {/* Alt text */}
                        <input
                          type="text"
                          className={`${INPUT_BASE} text-[11px]`}
                          placeholder="Alt mətni (SEO üçün: məhsulun adı, rəngi, növü...)"
                          value={img.alt ?? ''}
                          onChange={(e) =>
                            handleAltChange(img.id, e.target.value)
                          }
                        />

                        {/* Alt panel: mənbə, əsas etmə, silmə */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span className="rounded-full bg-white px-2 py-0.5">
                            {img.source === 'upload' ? 'Yüklənib' : 'Link'}
                          </span>
                          <div className="flex items-center gap-1">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(img.id)}
                                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                Əsas et
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(img.id)}
                              className="rounded-full bg-red-50 p-1 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Video URL hissəsi (səndəki kimi qalır) */}
      <FormGroup
        label="Video URL (opsional)"
        icon={<ImageIcon className="h-4 w-4" />}
        description="Məs: YouTube və ya digər platformadakı tanıtım videosu."
      >
        <input
          type="text"
          className={INPUT_BASE}
          placeholder="https://youtube.com/..."
          value={product.video ?? ''}
          onChange={(e) =>
            setProduct((s) => ({ ...s, video: e.target.value || undefined }))
          }
        />
      </FormGroup>

      {/* Böyüdülmüş preview modalı */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage.url}
              alt={previewImage.alt || 'Preview'}
              width={1600}
              height={1200}
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
            >
              Bağla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default MediaTab;