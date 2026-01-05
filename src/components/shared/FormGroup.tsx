
type FormGroupProps = {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  required?: boolean;
};

function FormGroup({
  label,
  icon,
  children,
  description,
  required,
}: FormGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        {icon && <span className="text-emerald-600">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-gray-500 leading-snug">{description}</p>
      )}
    </div>
  );
}
export default FormGroup;