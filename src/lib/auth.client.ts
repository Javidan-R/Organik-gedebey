// src/lib/auth.client.ts
// Admin giriş/çıxış funksiyaları — admin panelinin client component-lərindən çağırılır.

export async function loginAdmin(email: string, password: string) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Giriş uğursuz oldu')

  // Yönləndir
  window.location.href = '/admin/dashboard'
  return data.user
}

export async function logoutAdmin() {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
  window.location.href = '/admin/login'
}
