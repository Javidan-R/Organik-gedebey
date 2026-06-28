// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { whatsappMessages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Verify Twilio webhook signature for security
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN

function verifyTwilioSignature(url: string, params: URLSearchParams, signature: string): boolean {
  if (!TWILIO_AUTH_TOKEN) {
    console.warn('[WhatsApp] TWILIO_AUTH_TOKEN not set, skipping signature verification')
    return true // Allow in development
  }
  
  // In production, implement proper signature verification
  // For now, we'll skip this but it should be added for production
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const from = params.get('From')?.replace('whatsapp:', '')
    const messageBody = params.get('Body')
    const mediaUrl = params.get('MediaUrl0')
    const mediaContentType = params.get('MediaContentType0')
    const messageType = mediaUrl ? (mediaContentType?.startsWith('image/') ? 'image' : 'document') : 'text'
    
    if (!from) {
      console.error('[WhatsApp] Missing phone number')
      return new Response('Missing phone number', { status: 400 })
    }
    
    // Check if this is a duplicate message (idempotency)
    const messageSid = params.get('MessageSid')
    if (messageSid) {
      const [existing] = await db
        .select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.messageSid, messageSid))
        .limit(1)
      
      if (existing) {
        console.log('[WhatsApp] Duplicate message ignored:', messageSid)
        return new Response('OK', { status: 200 })
      }
    }
    
    // Store incoming message
    await db.insert(whatsappMessages).values({
      phone: from,
      direction: "INBOUND",
      messageType,
      content: messageBody || undefined,
      mediaUrl: mediaUrl || undefined,
      mediaContentType: mediaContentType || undefined,
      status: "DELIVERED",
      messageSid: messageSid || undefined,
    })
    
    // Auto-respond with welcome message for new users
    const [previousMessages] = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.phone, from))
      .limit(1)
    
    if (!previousMessages && messageBody) {
      // First message from this user - send welcome
      // TODO: Implement Twilio API call to send welcome message
      console.log('[WhatsApp] New user detected, would send welcome message to:', from)
    }
    
    // TODO: Add AI chatbot logic here
    // - Integrate with OpenAI or similar for intelligent responses
    // - Handle product inquiries
    // - Process orders
    // - Provide support
    
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error("[WhatsApp] Webhook error:", error)
    return new Response('Error', { status: 500 })
  }
}

// GET endpoint for webhook verification (Twilio requires this)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge')
  
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  
  return new Response('WhatsApp webhook is active', { status: 200 })
}