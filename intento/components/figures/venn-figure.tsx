import { BORDERS, COUNT_POS, LAYOUT, R, SECTIONS, VW, type Letter } from "@/components/venn-diagram"
import { formatCondition, STATUS_COLOR, STATUS_LABEL } from "@/lib/deg"
import type { Results } from "@/lib/api-service"
import { FONT } from "./scale"

// Venn of up- and downregulated DEGs side by side (venn_aumento_y_disminucion in the issue's script):
// every circle takes the direction's color and its name says which comparison it is.

const TITLE_H = 40
const CAPTION_H = 44

export default function VennFigure({ labels, control, thresholds, up, down }: {
  labels: string[]
  control: string | null
  thresholds: Results["thresholds"]
  up: Record<string, number>
  down: Record<string, number>
}) {
  const n = Math.min(Math.max(labels.length, 1), 3) as 1 | 2 | 3
  const letters = (["A", "B", "C"] as Letter[]).slice(0, n)
  const visible = SECTIONS.filter(id => BORDERS[id].every(l => letters.includes(l)))
  // Crop the interactive layout to what it draws (names above, circles, C's name below)
  const top = Math.min(...letters.map(l => LAYOUT[n].t[l]![1])) - 20
  const bottom = Math.max(...letters.flatMap(l => [LAYOUT[n].c[l]![1] + R, LAYOUT[n].t[l]![1]])) + 12
  const panelH = bottom - top
  const W = VW * 2
  const H = TITLE_H + panelH + CAPTION_H

  const panel = (dir: "up" | "down", counts: Record<string, number>, dx: number) => (
    <g transform={`translate(${dx}, 0)`}>
      <text x={VW / 2} y={26} textAnchor="middle" fontSize="17" fontWeight="700" fill="#333333">
        {STATUS_LABEL[dir]} genes
      </text>
      <g transform={`translate(0, ${TITLE_H - top})`}>
        {letters.map(l => (
          <circle key={l} cx={LAYOUT[n].c[l]![0]} cy={LAYOUT[n].c[l]![1]} r={R}
            fill={STATUS_COLOR[dir]} fillOpacity={0.65} stroke="#7A7A7A" strokeWidth={1.2} />
        ))}
        {letters.map((l, i) => (
          <text key={l} x={LAYOUT[n].t[l]![0]} y={LAYOUT[n].t[l]![1]} textAnchor="middle"
            fontSize="14" fontWeight="700" fill="#333333">{formatCondition(labels[i])}</text>
        ))}
        {visible.map(id => (
          <text key={id} x={COUNT_POS[n][id][0]} y={COUNT_POS[n][id][1]} textAnchor="middle"
            dominantBaseline="central" fontSize="15" fill="#222222">{counts[id] ?? 0}</text>
        ))}
      </g>
    </g>
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" fontFamily={FONT} role="img"
      aria-label="Venn diagrams of upregulated and downregulated genes">
      <rect width={W} height={H} fill="#ffffff" />
      {panel("up", up, 0)}
      {panel("down", down, VW)}
      <text x={W / 2} y={TITLE_H + panelH + 24} textAnchor="middle" fontSize="12" fill="#555555">
        DEGs: padj &lt; {thresholds.padj} and |log2FC| ≥ {thresholds.log2fc}{control ? ` vs control ${formatCondition(control)}` : ""}.
        Regions are exact intersections; areas are not proportional.
      </text>
    </svg>
  )
}
