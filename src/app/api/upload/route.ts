import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// Cloudinary is already configured in lib/cloudinary.ts with validation

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  resourceType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'organik-gedebey';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Fayl tapılmadı', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Fayl ölçüsü 10MB-dan böyük ola bilməz', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Dəstəklənməyən fayl növü', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Advanced upload options
    const uploadOptions: any = {
      folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // Auto-optimize
        { width: 2000, crop: 'limit' }, // Limit max width
      ],
      eager: [
        { width: 800, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'auto' }, // Optimized thumbnail
      ],
      eager_async: true,
    };

    const result = await cloudinary.uploader.upload(base64, uploadOptions);

    const uploadResult: UploadResult = {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      resourceType: result.resource_type,
    };

    return NextResponse.json({
      success: true,
      ...uploadResult,
    });
  } catch (error: any) {
    console.error('Upload xətası:', error);
    
    // Handle specific Cloudinary errors
    if (error?.http_code === 400) {
      return NextResponse.json(
        { error: 'Yükləmə xətası: ' + (error.message || 'Bilinməyən səhv'), code: 'UPLOAD_ERROR' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server xətası', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing files
export async function DELETE(req: NextRequest) {
  try {
    const { publicId } = await req.json();
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID tələb olunur', code: 'MISSING_PUBLIC_ID' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
    });

    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({ success: true, result: result.result });
    }

    return NextResponse.json(
      { error: 'Fayl silinə bilmədi', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Delete xətası:', error);
    return NextResponse.json(
      { error: 'Server xətası', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}