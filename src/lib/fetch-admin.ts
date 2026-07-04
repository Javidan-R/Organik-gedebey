// src/lib/fetch-admin.ts
'use client';

type AdminFetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function adminFetch<T = unknown>(
  url: string,
  options: AdminFetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}