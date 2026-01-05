'use client';

import { useState, useTransition } from 'react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('owner@organik.az');
  const [password, setPassword] = useState('');
  const [pending, start] = useTransition();
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    start(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setErr('E-poçt və ya şifrə yalnışdır');
        return;
      }
      window.location.href = '/admin/dashboard';
    });
  }

  return (
    <main className="min-h-screen grid place-items-center bg-emerald-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow border">
        <h1 className="text-2xl font-extrabold text-emerald-800 mb-4">Admin Girişi</h1>
        <label className="block mb-2 text-sm font-medium">E-poçt</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="input" />
        <label className="block mt-4 mb-2 text-sm font-medium">Şifrə</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" />
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        <button disabled={pending} className="btn btn-primary w-full mt-6">
          {pending ? 'Giriş edilir…' : 'Daxil ol'}
        </button>
      </form>
    </main>
  );
}
