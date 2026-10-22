"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatCondition } from "@/lib/deg"
import { DEFAULT_COLORS, DEFAULT_STATUS_LABELS, type FigureColors, type FigureSettings } from "@/lib/figure-style"
import type { Results } from "@/lib/api-service"

const COLOR_FIELDS: [keyof FigureColors, string][] = [
  ["up", "Upregulated"],
  ["down", "Downregulated"],
  ["ns", "Not significant"],
  ["mid", "Heatmap: log2FC = 0"],
  ["missing", "Heatmap: missing value"],
]

const Heading = ({ children }: { children: string }) => (
  <h3 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{children}</h3>
)

// Side panel to change the figures' colors and names; every change applies at once
export default function FigureSettingsSheet({ open, onOpenChange, results, settings, onChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: Results
  settings: FigureSettings
  onChange: (settings: FigureSettings) => void
}) {
  const set = (patch: Partial<FigureSettings>) => onChange({ ...settings, ...patch })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Figure settings</SheetTitle>
          <SheetDescription>
            Colors and names used in the figures and their downloads. Saved in this browser: colors and
            status names for every dataset, comparison names for this one.
          </SheetDescription>
        </SheetHeader>

        <section className="mt-6">
          <Heading>Colors</Heading>
          <div className="space-y-2">
            {COLOR_FIELDS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm">
                <input type="color" value={settings.colors[key]} aria-label={label}
                  onChange={e => set({ colors: { ...settings.colors, [key]: e.target.value } })}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                <span className="flex-1">{label}</span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">{settings.colors[key].toUpperCase()}</span>
              </label>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => set({ colors: DEFAULT_COLORS })}>Reset colors</Button>
        </section>

        <section className="mt-8">
          <Heading>Comparison names</Heading>
          <div className="space-y-2">
            {results.comparisons.map(c => (
              <label key={c.id} className="flex items-center gap-3 text-sm">
                <span className="w-16 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">{c.label}</span>
                <Input value={settings.comparisonLabels[c.id] ?? ""} placeholder={formatCondition(c.label)}
                  onChange={e => set({ comparisonLabels: { ...settings.comparisonLabels, [c.id]: e.target.value } })} />
              </label>
            ))}
            {results.control != null && (
              <label className="flex items-center gap-3 text-sm">
                <span className="w-16 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">control</span>
                <Input value={settings.controlLabel} placeholder={formatCondition(results.control)}
                  onChange={e => set({ controlLabel: e.target.value })} />
              </label>
            )}
          </div>
        </section>

        <section className="mt-8">
          <Heading>Status names</Heading>
          <div className="space-y-2">
            {(Object.keys(DEFAULT_STATUS_LABELS) as (keyof typeof DEFAULT_STATUS_LABELS)[]).map(key => (
              <Input key={key} value={settings.statusLabels[key]} placeholder={DEFAULT_STATUS_LABELS[key]} aria-label={DEFAULT_STATUS_LABELS[key]}
                onChange={e => set({ statusLabels: { ...settings.statusLabels, [key]: e.target.value } })} />
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3"
            onClick={() => set({ statusLabels: DEFAULT_STATUS_LABELS, comparisonLabels: {}, controlLabel: "" })}>
            Reset names
          </Button>
        </section>
      </SheetContent>
    </Sheet>
  )
}
