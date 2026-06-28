// src/app/api/analytics/web-vitals/route.ts
// Web Vitals analitikası

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { metric } = body

    // TODO: Web vitals məlumatlarını bazaya yaz
    // Bu hissədə analytics cədvəlinə yazmaq lazımdır
    console.log('[web-vitals] Metric received:', metric)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[web-vitals] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
