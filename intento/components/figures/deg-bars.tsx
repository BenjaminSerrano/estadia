import type { Results } from "@/lib/api-service"
import type { FigureStyle } from "@/lib/figure-style"
import { FONT } from "./scale"

// Divergent bars (barras_divergentes_numero_genes in the issue's script): upregulated DEGs above
// zero, downregulated below, one column per comparison vs the control.

// 1, 2 or 5 × 10^k, so that each side of zero gets about four ticks
function niceStep(max: number) {
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  return Math.max(1, [1, 2, 5, 10].find(m => m * mag >= raw)! * mag)
}

export default function DegBars({ style, thresholds, counts }: {
  style: FigureStyle
  thresholds: Results["thresholds"]
  counts: { up: number; down: number }[]
}) {
  const left = 78, right = 24, top = 70, plotH = 280
  const labels = style.comparisons
  const band = Math.max(120, 320 / Math.max(labels.length, 1))
  const barW = Math.min(band * 0.6, 72)
  const plotW = band * labels.length
  const W = left + plotW + right
  const H = top + plotH + 96

  const max = Math.max(1, ...counts.flatMap(c => [c.up, c.down]))
  const step = niceStep(max * 1.15)
  const lim = Math.ceil((max * 1.15) / step) * step
  const y = (v: number) => top + plotH / 2 - (v / lim) * (plotH / 2)
  const ticks = Array.from({ length: (2 * lim) / step + 1 }, (_, i) => -lim + i * step)
  const legendX = left + plotW / 2 - 110

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-2xl mx-auto block" fontFamily={FONT} role="img"
      aria-label="Number of upregulated and downregulated genes per comparison">
      <rect width={W} height={H} fill="#ffffff" />
      <text x={left} y={28} fontSize="17" fontWeight="700" fill="#333333">Differentially expressed genes</text>
      <text x={left} y={48} fontSize="12" fill="#555555">
        padj &lt; {thresholds.padj}; |log2FC| ≥ {thresholds.log2fc}
      </text>

      {ticks.map(t => (
        <g key={t}>
          <line x1={left} x2={left + plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#333333" : "#EBEBEB"} strokeWidth={t === 0 ? 1 : 0.8} />
          <text x={left - 8} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize="12" fill="#555555">{Math.abs(t)}</text>
        </g>
      ))}
      <text transform={`translate(22, ${top + plotH / 2}) rotate(-90)`} textAnchor="middle" fontSize="13" fill="#333333">
        Number of genes
      </text>

      {counts.map((c, i) => {
        const x = left + i * band + (band - barW) / 2
        return (
          <g key={i}>
            <rect x={x} y={y(c.up)} width={barW} height={y(0) - y(c.up)} fill={style.colors.up} />
            <rect x={x} y={y(0)} width={barW} height={y(-c.down) - y(0)} fill={style.colors.down} />
            {c.up > 0 && <text x={x + barW / 2} y={y(c.up) - 6} textAnchor="middle" fontSize="13" fill="#333333">{c.up}</text>}
            {c.down > 0 && <text x={x + barW / 2} y={y(-c.down) + 16} textAnchor="middle" fontSize="13" fill="#333333">{c.down}</text>}
            <text x={x + barW / 2} y={top + plotH + 22} textAnchor="middle" fontSize="13" fill="#333333">
              {labels[i]}
            </text>
          </g>
        )
      })}
      <text x={left + plotW / 2} y={top + plotH + 46} textAnchor="middle" fontSize="13" fill="#333333">
        {style.control ? `Comparison vs control ${style.control}` : "Comparison"}
      </text>

      {(["up", "down"] as const).map((s, i) => (
        <g key={s} transform={`translate(${legendX + i * 120}, ${top + plotH + 70})`}>
          <rect width={14} height={14} fill={style.colors[s]} />
          <text x={20} y={7} dominantBaseline="central" fontSize="12" fill="#333333">{style.status[s]}</text>
        </g>
      ))}
    </svg>
  )
}
