// src/app/api/admin/categories/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';

// Cloudinary konfiqurasiyası
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fayl göndərilməyib' }, { status: 400 });
    }

    // Fayl ölçüsü yoxlanışı
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fayl ölçüsü 5MB-dan böyükdür (${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    // Fayl tipi yoxlanışı
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Yalnız şəkil faylları qəbul olunur: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Faylı buffer-ə çevir
    const buffer = Buffer.from(await file.arrayBuffer());

    // Cloudinary-ə yüklə
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'organik-gedebey/categories',
          public_id: `cat-${Date.now()}`,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
          ],
          format: 'webp',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const data = result as any;

    return NextResponse.json({
      success: true,
      imageUrl: data.secure_url,
      imageId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Category upload error:', { error });
    return NextResponse.json({ error: 'Şəkil yüklənərkən xəta baş verdi' }, { status: 500 });
  }
}
