'use client'
import * as React from 'react'
export const Tabs: React.FC<{ tabs: { key:string; label:string }[]; value:string; onChange:(k:string)=>void }> = ({ tabs, value, onChange }) => (
<div className="flex gap-2">
{tabs.map(t => (
<button key={t.key} onClick={()=>onChange(t.key)} className={[ 'h-9 rounded-xl px-4 text-sm', value===t.key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300' ].join(' ')}>{t.label}</button>
))}
</div>
)