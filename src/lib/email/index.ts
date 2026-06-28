// lib/email/index.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface EmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Send email using Resend
 */
export async function sendEmail({ to, subject, html }: EmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Organik Gədəbəy <orders@organikgedebey.az>',
      to,
      subject,
      html,
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data
  } catch (error) {
    console.error("Email send error:", error)
    throw error
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    productName: string
    variantName: string
    qty: number
    priceAtOrder: string
  }>
  total: string
}) {
  const itemsList = order.items
    .map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.productName} ${item.variantName}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.qty}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          ${item.priceAtOrder} AZN
        </td>
      </tr>
    `)
    .join('')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #16a34a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 Organik Gədəbəy</h1>
          </div>
          <div class="content">
            <h2>Sifarişiniz təsdiqləndi!</h2>
            <p>Hörmətli ${order.customerName},</p>
            <p>Sifarişiniz uğurla qəbul edildi və tezliklə çatdırılacaq.</p>
            
            <p><strong>Sifariş nömrəsi:</strong> ${order.orderNumber}</p>
            
            <h3>Məhsullar:</h3>
            <table>
              <thead>
                <tr>
                  <th>Məhsul</th>
                  <th style="text-align: center;">Miqdar</th>
                  <th style="text-align: right;">Qiymət</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            
            <p class="total">Ümumi: ${order.total} AZN</p>
            
            <p>Təşəkkürlər!</p>
            <p style="color: #666; font-size: 14px;">
              Sual yaranarsa bizə müraciət edin: info@organikgedebey.az
            </p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: order.customerEmail,
    subject: `Sifarişiniz təsdiqləndi - ${order.orderNumber}`,
    html,
  })
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  status: string
) {
  const statusTexts: Record<string, string> = {
    CONFIRMED: "təsdiqləndi",
    PREPARING: "hazırlanır",
    READY_FOR_DELIVERY: "çatdırılmağa hazırdır",
    OUT_FOR_DELIVERY: "yoldadır",
    DELIVERED: "çatdırıldı",
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🌿 Sifariş statusu yeniləndi</h2>
          <p>Sifarişiniz <strong>${orderNumber}</strong> indi "${statusTexts[status]}" statusundadır.</p>
          <p>Təşəkkürlər!</p>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: email,
    subject: `Sifariş statusu: ${statusTexts[status]}`,
    html,
  })
}