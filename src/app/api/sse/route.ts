import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface SSEEvent {
  type: 'ping' | 'order' | 'notification' | 'system';
  timestamp: number;
  data?: any;
} 

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const clientId = crypto.randomUUID();
  
  // Track active connections for admin monitoring
  console.log(`[SSE] Client connected: ${clientId}`);
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg: SSEEvent = {
        type: 'system',
        timestamp: Date.now(),
        data: { clientId, status: 'connected' }
      };
      controller.enqueue(encoder.encode(`event: connect\ndata: ${JSON.stringify(connectMsg)}\n\n`));
      
      // Keep-alive ping every 15 seconds (reduced from 30 for better responsiveness)
      const pingInterval = setInterval(() => {
        const pingMsg: SSEEvent = {
          type: 'ping',
          timestamp: Date.now()
        };
        controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify(pingMsg)}\n\n`));
      }, 15000);
      
      // Simulate real-time events (in production, this would connect to Redis Pub/Sub or database changes)
      const eventInterval = setInterval(() => {
        // Simulate random events for demo
        const events: SSEEvent[] = [
          { type: 'order', timestamp: Date.now(), data: { id: crypto.randomUUID(), status: 'new', total: Math.random() * 100 } },
          { type: 'notification', timestamp: Date.now(), data: { message: 'Yeni sifariş alındı', type: 'info' } }
        ];
        
        if (Math.random() > 0.7) { // 30% chance to send event
          const event = events[Math.floor(Math.random() * events.length)];
          controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
        }
      }, 5000);

      // Cleanup on disconnect
      return () => {
        clearInterval(pingInterval);
        clearInterval(eventInterval);
        console.log(`[SSE] Client disconnected: ${clientId}`);
      };
    },
    cancel() {
      console.log(`[SSE] Stream cancelled: ${clientId}`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*', // CORS for development
    },
  });
}