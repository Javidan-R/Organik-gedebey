import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  // Minimal demo: realda DB/daxili sistemdən yoxla
  if (email && password && password.length >= 4) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('og_admin', 'ok', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60*60*8,
    });
    return res;
  }
  return NextResponse.json({ ok:false }, { status: 401 });
}
