import { X } from "lucide-react";
import { INPUT_BASE } from "../admin/products/ProductEditModal";

import  {  KeyboardEvent,} from 'react'
type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

function TagInput({ tags, onChange }: TagInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== 'Tab') return;
    const val = e.currentTarget.value
      .trim()
      .toLowerCase()
      .replace(/[^\wşəğüçıö-]/gi, ' ')
      .replace(/\s+/g, '-');
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    e.currentTarget.value = '';
    e.preventDefault();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        className={INPUT_BASE}
        placeholder="Etiket daxil edin və Enter/Tab basın..."
        onKeyDown={handleKeyDown}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="rounded-full p-0.5 text-emerald-700 hover:bg-emerald-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-gray-400">
            Məs: &quot;bal&quot;, &quot;pendir&quot;, &quot;organik&quot;.
          </span>
        )}
      </div>
    </div>
  );
}
export default TagInput;