import * as React from 'react'
export const Badge: React.FC<{ children: React.ReactNode; tone?: 'ok'|'warn'|'muted' }> = ({ children, tone='muted' }) => (
<span className={{ ok: 'bg-green-100 text-green-700', warn: 'bg-yellow-100 text-yellow-800', muted: 'bg-gray-100 text-gray-700' }[tone] + ' inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'}>{children}</span>
)