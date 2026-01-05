import * as React from 'react'
export const Table: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => (
<div className="overflow-x-auto">
<table className="min-w-full border-separate border-spacing-y-2">
<thead>
<tr>
{headers.map((h,i)=>(<th key={i} className="text-left text-xs font-medium text-gray-500 px-2">{h}</th>))}
</tr>
</thead>
<tbody>{children}</tbody>
</table>
</div>
)