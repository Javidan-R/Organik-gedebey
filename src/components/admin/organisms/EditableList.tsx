import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { INPUT_BASE } from "../products/ProductEditModal";

function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([v, ...items]);
    setDraft('');
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      <div className="flex gap-2">
        <input
          type="text"
          className={`${INPUT_BASE} text-xs`}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <ul className="space-y-1 text-xs">
        {items.map((it, idx) => (
          <li
            key={idx}
            className="flex items-start justify-between rounded-xl bg-white px-2 py-1 shadow-sm"
          >
            <span className="mr-2 flex-1">{it}</span>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-[11px] italic text-gray-400">
            Hələ heç nə əlavə edilməyib.
          </li>
        )}
      </ul>
    </div>
  );
}
export default EditableList;