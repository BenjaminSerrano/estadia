import { FONT, niceTicks, truncate } from "./scale"
import type { Results } from "@/lib/api-service"
import type { FigureStyle } from "@/lib/figure-style"

// Genes with the largest effects in one comparison (barras_log2FC_comparacion in the issue's
// script): horizontal log2FC bars, upregulated on top, labelled with the gene product.

const ROW_H = 22
const LABEL_W = 400
const PLOT_W = 330
const TOP = 70

export default function GeneBars({ results, index, genes, perDirection, style }: {
  results: Results
  style: FigureStyle
  index: number
  genes: number[] // gene indices, top to bottom
  perDirection: number
}) {
  const lfc = genes.map(k => results.genes[k].log2fc[index]!)
  const ticks = niceTicks(Math.min(0, ...lfc), Math.max(0, ...lfc), 5)
  const [lo, hi] = [ticks[0], ticks[ticks.length - 1]]
  const plotX = 12 + LABEL_W
  const x = (v: number) => plotX + ((v - lo) / (hi - lo)) * PLOT_W
  const plotH = Math.max(genes.length, 1) * ROW_H
  const W = plotX + PLOT_W + 24
  const H = TOP + plotH + 90
  const name = style.comparisons[index]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-4xl mx-auto block" fontFamily={FONT} role="img"
      aria-label={`Genes with the largest log2 fold change at ${name}`}>
      <rect width={W} height={H} fill="#ffffff" />
      <text x={12} y={28} fontSize="17" fontWeight="700" fill="#333333">
        Largest changes: {name}{style.control ? ` vs ${style.control}` : ""}
      </text>
      <text x={12} y={48} fontSize="12" fill="#555555">
        Up to {perDirection} DEGs per direction with the largest |log2FC| (padj &lt; {results.thresholds.padj}, |log2FC| ≥ {results.thresholds.log2fc})
      </text>

      {ticks.map(t => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={TOP} y2={TOP + plotH} stroke={t === 0 ? "#333333" : "#EBEBEB"} strokeWidth={t === 0 ? 1 : 0.8} />
          <text x={x(t)} y={TOP + plotH + 18} textAnchor="middle" fontSize="12" fill="#555555">{t}</text>
        </g>
      ))}
      <text x={plotX + PLOT_W / 2} y={TOP + plotH + 42} textAnchor="middle" fontSize="13" fill="#333333">log2 fold change</text>

      {genes.length === 0 && (
        <text x={plotX + PLOT_W / 2} y={TOP + ROW_H / 2} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#555555">
          No DEGs in this comparison
        </text>
      )}
      {genes.map((k, i) => {
        const g = results.genes[k]
        const v = lfc[i]
        return (
          <g key={k}>
            <title>{`${g.locustag}${g.name ? ` · ${g.name}` : ""}\nlog2FC ${v.toFixed(3)}, padj ${g.padj[index]!.toExponential(2)}`}</title>
            <rect x={Math.min(x(0), x(v))} y={TOP + i * ROW_H + 3} width={Math.abs(x(v) - x(0))} height={ROW_H - 6}
              fill={v > 0 ? style.colors.up : style.colors.down} />
            <text x={plotX - 8} y={TOP + i * ROW_H + ROW_H / 2} textAnchor="end" dominantBaseline="central" fontSize="11" fill="#333333">
              {g.name ? <>{truncate(g.name, 50)}<tspan fill="#8A8A8A"> {g.locustag}</tspan></> : g.locustag}
            </text>
          </g>
        )
      })}

      {(["up", "down"] as const).map((s, i) => (
        <g key={s} transform={`translate(${plotX + PLOT_W / 2 - 110 + i * 120}, ${TOP + plotH + 62})`}>
          <rect width={14} height={14} fill={style.colors[s]} />
          <text x={20} y={7} dominantBaseline="central" fontSize="12" fill="#333333">{style.status[s]}</text>
        </g>
      ))}
    </svg>
  )
}
