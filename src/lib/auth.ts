
// Mövcud cookie əsaslı auth helper (NextAuth olmadan)
export async function requireAuth(allowedRoles?: string[]) {
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  
  const authCookie = (await cookieStore).get('og_auth')
  
  if (!authCookie?.value) {
    throw new Error('Giriş tələb olunur')
  }

  let userData: { id: string; email: string; role: string; firstName: string; lastName: string }
  try {
    userData = JSON.parse(authCookie.value)
  } catch {
    throw new Error('Sessiya etibarsızdır')
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userData.role)) {
      throw new Error('Bu əməliyyat üçün icazəniz yoxdur')
    }
  }

  return {
    user: {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }
  }
}