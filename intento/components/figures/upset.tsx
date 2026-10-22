import { FONT } from "./scale"
import { SECTION_LETTERS } from "@/lib/deg"

// UpSet plot (upset_<direction> in the issue's script): one column per exact intersection,
// bars = genes, dots below = which comparisons it includes. Replaces the Venn beyond three
// comparisons. Used twice: interactive (theme colors, clickable columns) and as a white figure.

export interface UpsetPalette {
  background?: string // none = transparent (on the page's card)
  text: string
  muted: string
  stripe: string
  dotOff: string
  bar: string
  selected: string
}

const COL = 28
const BAR_H = 170
const ROW = 24
const MAX_COLUMNS = 30

export default function UpSet({ names, sizes, columns, palette, title, subtitle, selected, onSelect }: {
  names: string[] // one per comparison
  sizes: number[] // genes in each comparison's set
  columns: { key: string; genes: number[] }[] // from intersections(), largest first
  palette: UpsetPalette
  title?: string
  subtitle?: string
  selected?: string | null
  onSelect?: (key: string) => void
}) {
  const shown = columns.slice(0, MAX_COLUMNS)
  const n = names.length
  const longest = Math.max(...names.map((name, i) => `${name} (${sizes[i]})`.length))
  const left = 16 + longest * 7
  const top = title ? 70 : 24
  const W = Math.max(left + shown.length * COL + 16, 360)
  const H = top + BAR_H + 14 + n * ROW + 10
  const max = Math.max(1, ...shown.map(c => c.genes.length))
  const barY = (v: number) => top + BAR_H - (v / max) * (BAR_H - 16)
  const rowY = (j: number) => top + BAR_H + 14 + j * ROW + ROW / 2
  const note = columns.length > shown.length ? `the ${shown.length} largest of ${columns.length} intersections` : ""

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mx-auto block" style={{ maxWidth: W * 1.5 }} fontFamily={FONT} role="img"
      aria-label="UpSet plot of the exact intersections between comparisons">
      {palette.background && <rect width={W} height={H} style={{ fill: palette.background }} />}
      {title && <text x={16} y={28} fontSize="17" fontWeight="700" style={{ fill: palette.text }}>{title}</text>}
      {(subtitle || note) && (
        <text x={16} y={title ? 48 : 14} fontSize="12" style={{ fill: palette.muted }}>
          {[subtitle, note].filter(Boolean).join("; ")}
        </text>
      )}

      {names.map((name, j) => (
        <g key={j}>
          {j % 2 === 0 && <rect x={0} y={rowY(j) - ROW / 2} width={W} height={ROW} style={{ fill: palette.stripe }} />}
          <text x={left - 10} y={rowY(j)} textAnchor="end" dominantBaseline="central" fontSize="12" style={{ fill: palette.text }}>
            {name}<tspan style={{ fill: palette.muted }}> ({sizes[j]})</tspan>
          </text>
        </g>
      ))}
      <line x1={left} x2={left + shown.length * COL} y1={top + BAR_H} y2={top + BAR_H} strokeWidth={0.8} style={{ stroke: palette.muted }} />
      {!shown.length && (
        <text x={W / 2} y={top + BAR_H / 2} textAnchor="middle" fontSize="12" style={{ fill: palette.muted }}>No genes meet the thresholds</text>
      )}

      {shown.map((c, i) => {
        const x = left + i * COL
        const inside = names.map((_, j) => c.key.includes(SECTION_LETTERS[j]))
        const rows = inside.flatMap((on, j) => on ? [j] : [])
        const isSelected = selected === c.key
        const describe = rows.map(j => names[j]).join(" ∩ ")
        return (
          <g key={c.key} onClick={onSelect && (() => onSelect(c.key))} style={onSelect && { cursor: "pointer" }}
            role={onSelect && "button"} aria-pressed={onSelect && isSelected} tabIndex={onSelect && 0}
            onKeyDown={onSelect && (e => { if (e.key === "Enter" || e.key === " ") onSelect(c.key) })}>
            <title>{`${describe}${rows.length < n ? " only" : ""}: ${c.genes.length} genes`}</title>
            <rect x={x} y={top} width={COL} height={H - top} style={{ fill: isSelected ? palette.selected : "transparent" }} />
            <rect x={x + 5} y={barY(c.genes.length)} width={COL - 10} height={top + BAR_H - barY(c.genes.length)} style={{ fill: palette.bar }} />
            <text x={x + COL / 2} y={barY(c.genes.length) - 4} textAnchor="middle" fontSize="10" style={{ fill: palette.text }}>{c.genes.length}</text>
            {/* Absent comparisons first, so the line joining the present ones runs over them */}
            {inside.map((on, j) => !on && <circle key={j} cx={x + COL / 2} cy={rowY(j)} r={5} style={{ fill: palette.dotOff }} />)}
            {rows.length > 1 && (
              <line x1={x + COL / 2} x2={x + COL / 2} y1={rowY(rows[0])} y2={rowY(rows[rows.length - 1])} strokeWidth={2} style={{ stroke: palette.bar }} />
            )}
            {rows.map(j => <circle key={j} cx={x + COL / 2} cy={rowY(j)} r={6} style={{ fill: palette.bar }} />)}
          </g>
        )
      })}
    </svg>
  )
}
