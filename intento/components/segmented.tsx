"use client"

// Row of mutually exclusive buttons (direction of change, heatmap options, comparison)
export default function Segmented<T extends string | number>({ value, options, onChange, label }: {
  value: T
  options: [T, string][]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden w-fit" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`px-3 py-1.5 font-[family-name:var(--font-mono)] text-xs border-r border-border last:border-r-0 transition-colors ${
            value === v ? "bg-sky-500/15 text-sky-400" : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >{text}</button>
      ))}
    </div>
  )
}
