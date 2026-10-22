import { FONT, niceTicks } from "./scale"
import { formatCondition, STATUS_COLOR, STATUS_LABEL, type Status } from "@/lib/deg"
import type { Results } from "@/lib/api-service"

// Volcano plot of one comparison (volcano_comparacion in the issue's script): every gene with
// log2FC and padj, colored by classification, dashed lines at the DEG thresholds.

const LEFT = 64
const TOP = 70
const PLOT_W = 440
const PLOT_H = 330
const DOUBLE_XMIN = 2.2250738585072014e-308 // R's .Machine$double.xmin

export default function Volcano({ results, statuses, index }: {
  results: Results
  statuses: Status[][]
  index: number
}) {
  const t = results.thresholds
  const pts = results.genes.flatMap((g, k) => {
    const s = statuses[k][index]
    return s === "na" ? [] : [{ k, s, l: g.log2fc[index]!, p: g.padj[index]! }]
  })
  // padj = 0 (numerical underflow) is drawn at a tenth of the smallest positive padj, only here
  const positive = pts.filter(d => d.p > 0).map(d => d.p)
  const floor = positive.length ? Math.max(DOUBLE_XMIN, positive.reduce((a, b) => Math.min(a, b)) / 10) : 1e-16
  const yv = (p: number) => -Math.log10(Math.max(p, floor))
  const hasZero = pts.some(d => d.p === 0)

  const xt = niceTicks(Math.min(-t.log2fc, ...pts.map(d => d.l)), Math.max(t.log2fc, ...pts.map(d => d.l)), 6)
  const yt = niceTicks(0, Math.max(-Math.log10(t.padj), ...pts.map(d => yv(d.p))), 5)
  const x = (v: number) => LEFT + ((v - xt[0]) / (xt[xt.length - 1] - xt[0])) * PLOT_W
  const y = (v: number) => TOP + PLOT_H - (v / yt[yt.length - 1]) * PLOT_H
  const W = LEFT + PLOT_W + 24
  const H = TOP + PLOT_H + 92
  const c = results.comparisons[index]
  const order: Status[] = ["ns", "down", "up"] // DEGs drawn on top
  const count = (s: Status) => pts.filter(d => d.s === s).length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-2xl mx-auto block" fontFamily={FONT} role="img"
      aria-label={`Volcano plot at ${formatCondition(c.label)}`}>
      <rect width={W} height={H} fill="#ffffff" />
      <text x={LEFT} y={28} fontSize="17" fontWeight="700" fill="#333333">
        Volcano: {formatCondition(c.label)}{results.control ? ` vs ${formatCondition(results.control)}` : ""}
      </text>
      <text x={LEFT} y={48} fontSize="12" fill="#555555">
        {pts.length} genes with log2FC and padj{hasZero ? `; padj = 0 drawn at ${floor.toExponential(1)}` : ""}
      </text>

      {xt.map(v => (
        <g key={`x${v}`}>
          <line x1={x(v)} x2={x(v)} y1={TOP} y2={TOP + PLOT_H} stroke="#EBEBEB" strokeWidth={0.8} />
          <text x={x(v)} y={TOP + PLOT_H + 18} textAnchor="middle" fontSize="12" fill="#555555">{v}</text>
        </g>
      ))}
      {yt.map(v => (
        <g key={`y${v}`}>
          <line x1={LEFT} x2={LEFT + PLOT_W} y1={y(v)} y2={y(v)} stroke="#EBEBEB" strokeWidth={0.8} />
          <text x={LEFT - 8} y={y(v)} textAnchor="end" dominantBaseline="central" fontSize="12" fill="#555555">{v}</text>
        </g>
      ))}
      <rect x={LEFT} y={TOP} width={PLOT_W} height={PLOT_H} fill="none" stroke="#333333" strokeWidth={0.8} />
      <text x={LEFT + PLOT_W / 2} y={TOP + PLOT_H + 42} textAnchor="middle" fontSize="13" fill="#333333">log2 fold change</text>
      <text transform={`translate(18, ${TOP + PLOT_H / 2}) rotate(-90)`} textAnchor="middle" fontSize="13" fill="#333333">
        −log10(adjusted p-value)
      </text>

      {order.map(s => (
        <g key={s} fill={STATUS_COLOR[s]} fillOpacity={0.65}>
          {pts.filter(d => d.s === s).map(d => (
            <circle key={d.k} cx={x(d.l)} cy={y(yv(d.p))} r={s === "ns" ? 2 : 2.6} />
          ))}
        </g>
      ))}
      <g stroke="#666666" strokeWidth={0.9} strokeDasharray="4 3">
        <line x1={x(-t.log2fc)} x2={x(-t.log2fc)} y1={TOP} y2={TOP + PLOT_H} />
        <line x1={x(t.log2fc)} x2={x(t.log2fc)} y1={TOP} y2={TOP + PLOT_H} />
        <line x1={LEFT} x2={LEFT + PLOT_W} y1={y(-Math.log10(t.padj))} y2={y(-Math.log10(t.padj))} />
      </g>

      {(["up", "down", "ns"] as const).map((s, i) => (
        <g key={s} transform={`translate(${LEFT + PLOT_W / 2 - 200 + i * 140}, ${TOP + PLOT_H + 64})`}>
          <circle cx={6} cy={7} r={5} fill={STATUS_COLOR[s]} />
          <text x={16} y={7} dominantBaseline="central" fontSize="12" fill="#333333">{STATUS_LABEL[s]} ({count(s)})</text>
        </g>
      ))}
    </svg>
  )
}
