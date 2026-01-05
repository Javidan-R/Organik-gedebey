export async function loginAdmin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Giriş uğursuz oldu')
  window.location.href = '/admin/dashboard'
}

export async function logoutAdmin() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/admin/login'
}
