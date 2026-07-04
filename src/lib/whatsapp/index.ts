// lib/whatsapp/index.ts
import { Twilio } from 'twilio'
import { db } from '@/lib/db'
import { whatsappMessages } from '@/lib/db/schema'

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)
 
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  orderId?: string
) {
  try {
    // Format phone number
    const formattedPhone = to.startsWith('+') ? to : `+${to}`
    
    // Send via Twilio
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
    })
    
    // Log to database
    await db.insert(whatsappMessages).values({
      phone: formattedPhone,
      direction: "OUTBOUND",
      messageType: "text",
      content: message,
      status: "SENT",
      orderId,
    })
    
    return result
  } catch (error) {
    console.error("WhatsApp send error:", error)
    throw error
  }
}

/**
 * Send order confirmation via WhatsApp
 */
export async function sendOrderWhatsApp(order: {
  orderNumber: string
  customerPhone: string
  total: string
  id: string
}) {
  const message = `
🌿 *Organik Gədəbəy*

Sifarişiniz qəbul edildi!

📦 Sifariş: ${order.orderNumber}
💰 Cəmi: ${order.total} AZN

Tezliklə çatdırılacaq.
Təşəkkürlər! 🙏
  `.trim()
  
  return sendWhatsAppMessage(order.customerPhone, message, order.id)
}

/**
 * Send delivery update via WhatsApp
 */
export async function sendDeliveryUpdateWhatsApp(
  phone: string,
  orderNumber: string,
  status: string,
  orderId: string
) {
  const statusEmojis: Record<string, string> = {
    CONFIRMED: "✅",
    PREPARING: "👨‍🍳",
    OUT_FOR_DELIVERY: "🚚",
    DELIVERED: "🎉",
  }
  
  const statusTexts: Record<string, string> = {
    CONFIRMED: "təsdiqləndi",
    PREPARING: "hazırlanır",
    OUT_FOR_DELIVERY: "yoldadır",
    DELIVERED: "çatdırıldı",
  }
  
  const message = `
${statusEmojis[status] || "📦"} *Sifariş statusu*

Sifarişiniz ${orderNumber} indi *${statusTexts[status]}* statusundadır.

🌿 Organik Gədəbəy
  `.trim()
  
  return sendWhatsAppMessage(phone, message, orderId)
}