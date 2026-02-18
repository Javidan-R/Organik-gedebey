// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { whatsappMessages } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const from = params.get('From')?.replace('whatsapp:', '')
    const messageBody = params.get('Body')
    const mediaUrl = params.get('MediaUrl0')
    const messageType = mediaUrl ? 'image' : 'text'
    
    // Log incoming message
    await db.insert(whatsappMessages).values({
      phone: from!,
      direction: "INBOUND",
      messageType,
      content: messageBody || undefined,
      mediaUrl: mediaUrl || undefined,
      status: "DELIVERED",
    })
    
    // Auto-respond (optional)
    // TODO: Add AI chatbot logic here
    
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error("WhatsApp webhook error:", error)
    return new Response('Error', { status: 500 })
  }
}