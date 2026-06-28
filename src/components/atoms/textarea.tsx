import * as React from 'react'
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
({ className, ...props }, ref) => (
<textarea ref={ref} className={['w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-300', className].join(' ')} {...props} />
)
)
Textarea.displayName = 'Textarea'