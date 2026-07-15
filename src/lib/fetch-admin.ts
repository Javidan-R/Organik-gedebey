// src/lib/fetch-admin.ts
'use client';

import { COOKIE_ADMIN } from '@/lib/auth/jwt';

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

  const token = getCookie(COOKIE_ADMIN);

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[adminFetch] Cookie "${COOKIE_ADMIN}" =`,
      token ? token.substring(0, 10) + '...' : 'YOXDUR'
    );
  }

  const combinedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    combinedHeaders['Authorization'] = `Bearer ${token}`;
  }

  const stringifiedBody = body !== undefined ? JSON.stringify(body) : undefined;

  const res = await fetch(url, {
    method,
    headers: combinedHeaders,
    credentials: 'include',
    body: stringifiedBody,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}