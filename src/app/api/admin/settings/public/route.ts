import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const allSettings = await db.query.settings.findMany();
    const result: Record<string, any> = {};
    for (const row of allSettings) {
      result[row.key] = row.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Public settings error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}