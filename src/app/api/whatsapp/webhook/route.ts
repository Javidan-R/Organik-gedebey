import { NextResponse } from 'next/server';
import { WhatsQueue, WhatsDraft } from '@/server/whQueue';

// Sadə parser: "p-1x2, p-3x1" və ya "slug:dag-bali x2" formalı
function parseText(text: string) {
  const items: { productId: string; qty: number }[] = [];
  const re = /([a-z0-9\-]+)\s*(?:x|\*)\s*(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    items.push({ productId: m[1], qty: +m[2] });
  }
  return items;
}

export async function POST(req: Request) {
  const body = await req.json().catch(()=>({}));
  const raw = (body.message || body.text || '').toString();
  if (!raw) return NextResponse.json({ ok:false, reason:'empty' }, { status:400 });

  const items = parseText(raw);
  if (!items.length) return NextResponse.json({ ok:false, reason:'no_items' }, { status:422 });

  const draft: WhatsDraft = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    text: raw,
    items,
    customerName: body.customer || 'WhatsApp',
    channel: 'whatsapp',
  };
  WhatsQueue.push(draft);
  return NextResponse.json({ ok:true, id:draft.id, count: items.length });
}
