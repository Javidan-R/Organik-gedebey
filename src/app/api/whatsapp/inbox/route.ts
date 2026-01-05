import { NextResponse } from 'next/server';
import { WhatsQueue } from '@/server/whQueue';

export async function GET() {
  return NextResponse.json({ items: WhatsQueue.list() });
}
export async function DELETE(req: Request) {
  const { id } = await req.json().catch(()=>({}));
  if (!id) return NextResponse.json({ ok:false }, { status:400 });
  WhatsQueue.pop(id);
  return NextResponse.json({ ok:true });
}
