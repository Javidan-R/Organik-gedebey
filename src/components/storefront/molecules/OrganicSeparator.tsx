
// ===================================================
// ORGANIC SEPARATOR
// ===================================================

export function OrganicSeparator({ small }: { small?: boolean }) {
  return (
    <div className="flex justify-center">
      <div
        className={`relative flex items-center justify-center ${
          small ? 'my-2 h-7 w-40' : 'my-3 h-9 w-52'
        }`}
      >
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-lime-200 to-transparent" />
        <div className="mx-2 flex items-center justify-center">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-lime-100">
            🌱
          </span>
        </div>
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-lime-200 to-transparent" />
      </div>
    </div>
  )
}
