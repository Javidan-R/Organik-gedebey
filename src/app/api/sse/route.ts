export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Burada real məlumat göndərilməlidir (məsələn, Redis Pub/Sub və ya verilənlər bazası dəyişiklikləri)
      // Nümunə sadəcə ping göndərir
      const interval = setInterval(() => {
        const data = { type: 'ping', timestamp: Date.now() };
        controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify(data)}\n\n`));
      }, 30000);

      // Təmizləmə
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}