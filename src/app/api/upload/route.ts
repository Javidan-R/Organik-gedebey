import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Fayl tapılmadı' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: 'organik-gedebey',
      resource_type: 'auto', // şəkil, video, avtomatik
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error('Upload xətası:', error);
    return NextResponse.json({ error: 'Yükləmə uğursuz' }, { status: 500 });
  }
}