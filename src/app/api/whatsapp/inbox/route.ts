import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whatsappMessages } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
 
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    
    // Build query conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(whatsappMessages.status, status as any));
    }
    if (phone) {
      conditions.push(eq(whatsappMessages.phone, phone));
    }
    
    // Fetch messages with pagination
    const messages = await db
      .select()
      .from(whatsappMessages)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalCount = await db
      .select({ count: whatsappMessages.id })
      .from(whatsappMessages)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    // Group by phone number for conversation view
    const conversations = messages.reduce((acc, msg) => {
      if (!acc[msg.phone]) {
        acc[msg.phone] = {
          phone: msg.phone,
          messages: [],
          lastMessage: msg.createdAt,
          unreadCount: 0,
        };
      }
      acc[msg.phone].messages.push(msg);
      if (msg.direction === 'INBOUND' && msg.status === 'DELIVERED') {
        acc[msg.phone].unreadCount++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json({
      conversations: Object.values(conversations),
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount.length,
      },
    });
  } catch (error) {
    console.error('[WhatsApp Inbox] Error:', error);
    return NextResponse.json(
      { error: 'Mesajlar yüklənə bilmədi' },
      { status: 500 }
    );
  }
}

// Send a message via WhatsApp
export async function POST(req: Request) {
  try {
    const { phone, message, mediaUrl } = await req.json();
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Telefon nömrəsi və mesaj tələb olunur' },
        { status: 400 }
      );
    }
    
    // Store outbound message
    const [newMessage] = await db.insert(whatsappMessages).values({
      phone,
      direction: 'OUTBOUND',
      messageType: mediaUrl ? 'image' : 'text',
      content: message,
      mediaUrl,
      status: 'QUEUED',
    }).returning();
    
    // TODO: Implement actual Twilio API call to send message
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    //   to: `whatsapp:${phone}`,
    //   body: message,
    //   mediaUrl: mediaUrl ? [mediaUrl] : undefined,
    // });
    
    // Update status to sent
    await db
      .update(whatsappMessages)
      .set({ status: 'SENT' })
      .where(eq(whatsappMessages.id, newMessage.id));
    
    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('[WhatsApp Send] Error:', error);
    return NextResponse.json(
      { error: 'Mesaj göndərilə bilmədi' },
      { status: 500 }
    );
  }
}

// Mark messages as read
export async function PATCH(req: Request) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Telefon nömrəsi tələb olunur' },
        { status: 400 }
      );
    }
    
    await db
      .update(whatsappMessages)
      .set({ status: 'READ' })
      .where(and(eq(whatsappMessages.phone, phone), eq(whatsappMessages.direction, 'INBOUND')));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp Mark Read] Error:', error);
    return NextResponse.json(
      { error: 'Mesajlar oxunulmuş olaraq qeyd edilə bilmədi' },
      { status: 500 }
    );
  }
}

// Delete a conversation or message
export async function DELETE(req: Request) {
  try {
    const { id, phone } = await req.json();
    
    if (!id && !phone) {
      return NextResponse.json(
        { error: 'ID və ya telefon nömrəsi tələb olunur' },
        { status: 400 }
      );
    }
    
    if (id) {
      // Delete single message
      await db.delete(whatsappMessages).where(eq(whatsappMessages.id, id));
    } else if (phone) {
      // Delete entire conversation
      await db.delete(whatsappMessages).where(eq(whatsappMessages.phone, phone));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp Delete] Error:', error);
    return NextResponse.json(
      { error: 'Mesaj silinə bilmədi' },
      { status: 500 }
    );
  }
}
