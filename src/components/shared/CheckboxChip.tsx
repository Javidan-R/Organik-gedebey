
type CheckboxChipProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function CheckboxChip({ label, checked, onChange }: CheckboxChipProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border shadow-sm transition ${
        checked
          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
          checked ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </button>
  );
}
export default CheckboxChip;