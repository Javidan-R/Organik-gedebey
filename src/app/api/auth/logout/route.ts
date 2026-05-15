import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Uğurla çıxış edildi',
  })

  // Bütün auth cookie-ləri təmizlə
  response.cookies.delete('og_auth')
  response.cookies.delete('og_admin')

  return response
}