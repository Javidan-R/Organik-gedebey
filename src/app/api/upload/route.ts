// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { uploadToS3, deleteFromS3 } from "@/lib/storage/s3"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "products"
    
    if (!file) {
      return NextResponse.json(
        { error: "File tələb olunur" },
        { status: 400 }
      )
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File maksimum 5MB ola bilər" },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Yalnız şəkil faylları yüklənə bilər" },
        { status: 400 }
      )
    }
    
    // Upload to S3
    const url = await uploadToS3(file, folder)
    
    return NextResponse.json({
      success: true,
      url,
      message: "File uğurla yükləndi",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "File yüklənərkən xəta baş verdi" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "MANAGER"])
    
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: "URL tələb olunur" },
        { status: 400 }
      )
    }
    
    await deleteFromS3(url)
    
    return NextResponse.json({
      success: true,
      message: "File uğurla silindi",
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "File silinərkən xəta" },
      { status: 500 }
    )
  }
}