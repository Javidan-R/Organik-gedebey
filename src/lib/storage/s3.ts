// lib/storage/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
 
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET;

if (!region || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error('Missing required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const BUCKET = bucket;

/**
 * Upload file to S3
 * @param file - File object from FormData
 * @param folder - Folder name (products, users, orders, etc.)
 * @returns URL of uploaded file
 */
export async function uploadToS3(
  file: File,
  folder: string = "products"
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const ext = file.name.split('.').pop()
    const filename = `${folder}/${timestamp}-${randomString}.${ext}`
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make file publicly accessible
    })
    
    await s3Client.send(command)
    
    // Return public URL
    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
    return url
  } catch (error) {
    console.error("S3 upload error:", error)
    throw new Error("File yüklənərkən xəta baş verdi")
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    // Extract key from URL
    const key = url.split('.com/')[1]
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
    
    await s3Client.send(command)
  } catch (error) {
    console.error("S3 delete error:", error)
    throw new Error("File silinərkən xəta baş verdi")
  }
}

/**
 * Generate signed URL for private files
 */
export async function getSignedS3Url(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  
  const url = await getSignedUrl(s3Client, command, { expiresIn })
  return url
}