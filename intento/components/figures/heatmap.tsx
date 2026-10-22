import { FONT, mixColor, truncate } from "./scale"
import { formatCondition, STATUS_COLOR, type HeatmapData, type RankBy } from "@/lib/deg"
import type { Results } from "@/lib/api-service"

// log2FC heatmap, genes x comparisons (heatmap_log2FC in the issue's script): diverging colors
// capped at ±limit for display only, "*" where the gene is a DEG, rows clustered when complete.

const MID_COLOR = "#FFFFFF"
const NA_COLOR = "#D5D5D5"
const ROW_H = 14
const TOP = 104
const LABEL_W = 470

export default function Heatmap({ results, data, limit, rankBy }: {
  results: Results
  data: HeatmapData
  limit: number
  rankBy: RankBy
}) {
  const { rows, tree } = data
  const n = results.comparisons.length
  const cellW = Math.min(72, Math.max(44, 320 / n))
  const treeW = tree ? 80 : 0
  const cellsX = 12 + treeW + (tree ? 6 : 0)
  const W = Math.max(cellsX + cellW * n + 10 + LABEL_W, 560)
  const H = TOP + rows.length * ROW_H + 16
  const y = (row: number) => TOP + row * ROW_H

  const color = (v: number | null) => v == null ? NA_COLOR
    : mixColor(MID_COLOR, v >= 0 ? STATUS_COLOR.up : STATUS_COLOR.down, Math.min(Math.abs(v), limit) / limit)

  // Dendrogram: each merge drawn as an elbow between its two members, root at the left
  const branches: string[] = []
  if (tree) {
    const row = new Map(tree.order.map((leaf, i) => [leaf, i]))
    const maxH = Math.max(...tree.height) || 1
    const x = (h: number) => 12 + treeW * (1 - h / maxH)
    const nodes: { y: number; h: number }[] = []
    const at = (ref: number) => ref < 0 ? { y: y(row.get(-ref - 1)!) + ROW_H / 2, h: 0 } : nodes[ref - 1]
    tree.merge.forEach(([a, b], s) => {
      const A = at(a), B = at(b), h = tree.height[s]
      branches.push(`M${x(A.h)},${A.y}H${x(h)}V${B.y}H${x(B.h)}`)
      nodes.push({ y: (A.y + B.y) / 2, h })
    })
  }

  const vs = results.control ? ` vs ${formatCondition(results.control)}` : ""
  const legendX = W - 190

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-4xl mx-auto block" fontFamily={FONT} role="img"
      aria-label="Heatmap of log2 fold changes, genes by comparison">
      <defs>
        <linearGradient id="heatmap-scale">
          <stop offset="0" stopColor={STATUS_COLOR.down} />
          <stop offset="0.5" stopColor={MID_COLOR} />
          <stop offset="1" stopColor={STATUS_COLOR.up} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="#ffffff" />
      <text x={12} y={28} fontSize="17" fontWeight="700" fill="#333333">log2FC by comparison</text>
      <text x={12} y={48} fontSize="12" fill="#555555">
        {rows.length} DEGs with the {rankBy === "padj" ? "smallest padj" : "largest |log2FC|"} in any comparison{vs ? ` (comparisons${vs})` : ""}
      </text>
      <text x={12} y={64} fontSize="12" fill="#555555">
        * = padj &lt; {results.thresholds.padj} and |log2FC| ≥ {results.thresholds.log2fc}; color capped at ±{limit}
        {tree ? "; rows clustered (complete linkage, Euclidean)" : data.missing ? "; grey = missing value, rows not clustered" : ""}
      </text>

      <text x={legendX + 75} y={22} textAnchor="middle" fontSize="11" fill="#333333">log2FC</text>
      <rect x={legendX} y={28} width={150} height={10} fill="url(#heatmap-scale)" stroke="#BBBBBB" strokeWidth={0.5} />
      {[-limit, 0, limit].map((v, i) => (
        <text key={v} x={legendX + i * 75} y={52} textAnchor="middle" fontSize="11" fill="#555555">{v > 0 ? `+${v}` : v}</text>
      ))}

      {results.comparisons.map((c, j) => (
        <text key={c.id} x={cellsX + j * cellW + cellW / 2} y={TOP - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#333333">
          {formatCondition(c.label)}
        </text>
      ))}

      <path d={branches.join("")} fill="none" stroke="#555555" strokeWidth={0.8} />

      {rows.map((row, i) => {
        const g = results.genes[row.k]
        return (
          <g key={row.k}>
            <title>
              {`${g.locustag}${g.name ? ` · ${g.name}` : ""}\n` + results.comparisons.map((c, j) =>
                `${formatCondition(c.label)}: log2FC ${g.log2fc[j]?.toFixed(3) ?? "NA"}, padj ${g.padj[j]?.toExponential(2) ?? "NA"}`).join("\n")}
            </title>
            {row.values.map((v, j) => (
              <rect key={j} x={cellsX + j * cellW} y={y(i)} width={cellW} height={ROW_H} fill={color(v)} />
            ))}
            {row.marks.map((m, j) => m && (
              <text key={j} x={cellsX + j * cellW + cellW / 2} y={y(i) + ROW_H / 2 + 4} textAnchor="middle" fontSize="11" fill="#333333">*</text>
            ))}
            <text x={cellsX + cellW * n + 10} y={y(i) + ROW_H / 2} dominantBaseline="central" fontSize="11" fill="#333333">
              {g.name ? <>{truncate(g.name, 58)}<tspan fill="#8A8A8A"> {g.locustag}</tspan></> : g.locustag}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
