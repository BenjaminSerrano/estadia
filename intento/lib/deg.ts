import type { Direction, Results } from "./api-service"
import { hclustComplete, type Tree } from "./cluster"

// Post-analysis of the DESeq2 results (issue #1 «Prueba con S. aureus»): same DEG rule as the
// backend's _filter_clause, so counts here match the Venn regions and the gene tables.

export type Status = "up" | "down" | "ns" | "na"

export const STATUS_LABEL: Record<Status, string> = {
  up: "Upregulated",
  down: "Downregulated",
  ns: "Not significant",
  na: "Not evaluable",
}

// Defaults from the issue's R script
export const STATUS_COLOR: Record<Status, string> = {
  up: "#EDAFAF",
  down: "#AECBE8",
  ns: "#D3D3D3",
  na: "#E6E6E6",
}

// Region / intersection keys: one letter per comparison in order ("A", "AB", "ABD", ...)
export const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// Numeric labels are temperatures ("16" -> "16°C"); anything else is shown as-is
export const formatCondition = (l: string) => /^\d+(\.\d+)?$/.test(l) ? `${l}°C` : l

export function classify(lfc: number | null, padj: number | null, t: Results["thresholds"]): Status {
  if (lfc == null || padj == null || !Number.isFinite(lfc) || !Number.isFinite(padj)) return "na"
  if (padj < t.padj && Math.abs(lfc) >= t.log2fc) return lfc > 0 ? "up" : "down"
  return "ns"
}

// statuses[gene][comparison]
export const statusMatrix = (r: Results): Status[][] =>
  r.genes.map(g => g.log2fc.map((lfc, i) => classify(lfc, g.padj[i], r.thresholds)))

export const inSet = (s: Status, direction: Direction) =>
  direction ? s === direction : s === "up" || s === "down"

// Genes per Venn region ("A", "AB", ...): exact intersections, as in the gene table
export function regionCounts(statuses: Status[][], direction: Direction): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of statuses) {
    const key = row.map((s, i) => inSet(s, direction) ? SECTION_LETTERS[i] : "").join("")
    if (key) counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

// Exact intersections (UpSet columns), largest first; ties as in the issue's script:
// more comparisons first, then the 0/1 membership pattern
export function intersections(statuses: Status[][], direction: Direction) {
  const groups = new Map<string, number[]>()
  statuses.forEach((row, k) => {
    const key = row.map((s, i) => inSet(s, direction) ? SECTION_LETTERS[i] : "").join("")
    if (key) groups.set(key, [...(groups.get(key) ?? []), k])
  })
  const n = statuses[0]?.length ?? 0
  const bits = (key: string) => Array.from({ length: n }, (_, i) => key.includes(SECTION_LETTERS[i]) ? "1" : "0").join("")
  return [...groups].map(([key, genes]) => ({ key, genes }))
    .sort((a, b) => b.genes.length - a.genes.length || b.key.length - a.key.length || (bits(a.key) < bits(b.key) ? -1 : 1))
}

export const directionCounts = (statuses: Status[][], n: number) =>
  Array.from({ length: n }, (_, i) => ({
    up: statuses.filter(row => row[i] === "up").length,
    down: statuses.filter(row => row[i] === "down").length,
  }))

// Up in one comparison and down in another
export const isOpposite = (row: Status[]) => row.includes("up") && row.includes("down")

// One row per gene: locus tag, product, KO and, per comparison, log2FC, padj and classification
export function jointTable(r: Results, statuses: Status[][], keep: (row: Status[]) => boolean = () => true) {
  const vs = (l: string) => r.control ? `${l}_vs_${r.control}` : l
  const header = [
    "locus_tag", "product", "KO",
    ...r.comparisons.flatMap(c => [`log2FC_${vs(c.label)}`, `padj_${vs(c.label)}`, `class_${vs(c.label)}`]),
    "n_comparisons_DE", "opposite_sign",
  ]
  const rows = r.genes.flatMap((g, k) => {
    const st = statuses[k]
    if (!keep(st)) return []
    return [[
      g.locustag, g.name, g.ko,
      ...r.comparisons.flatMap((_, i) => [g.log2fc[i], g.padj[i], STATUS_LABEL[st[i]]]),
      st.filter(s => s === "up" || s === "down").length, isOpposite(st),
    ]]
  })
  return [header, ...rows]
}

const isDeg = (s: Status) => s === "up" || s === "down"
const byLocus = (r: Results, a: number, b: number) =>
  r.genes[a].locustag < r.genes[b].locustag ? -1 : r.genes[a].locustag > r.genes[b].locustag ? 1 : 0

export type RankBy = "padj" | "lfc"

// Heatmap rows as in the issue's script: DEGs in at least one comparison, ranked by their smallest
// padj (or largest |log2FC|) over the comparisons where both values exist; rows clustered
// with complete linkage unless a value is missing (then they keep the ranking order)
export function heatmapData(r: Results, statuses: Status[][], topN: number, rankBy: RankBy) {
  const ranked = r.genes.flatMap((g, k) => {
    if (!statuses[k].some(isDeg)) return []
    let minPadj = Infinity, maxAbsLfc = 0
    g.log2fc.forEach((l, i) => {
      if (statuses[k][i] === "na") return
      minPadj = Math.min(minPadj, g.padj[i]!)
      maxAbsLfc = Math.max(maxAbsLfc, Math.abs(l!))
    })
    return [{ k, minPadj, maxAbsLfc }]
  }).sort((a, b) => rankBy === "padj"
    ? a.minPadj - b.minPadj || b.maxAbsLfc - a.maxAbsLfc || byLocus(r, a.k, b.k)
    : b.maxAbsLfc - a.maxAbsLfc || a.minPadj - b.minPadj || byLocus(r, a.k, b.k))

  const rows = ranked.slice(0, topN).map((x, i) => ({
    ...x,
    rank: i + 1,
    values: r.genes[x.k].log2fc.map(v => v != null && Number.isFinite(v) ? v : null),
    marks: statuses[x.k].map(isDeg),
  }))
  const missing = rows.some(row => row.values.includes(null))
  const tree: Tree | null = rows.length > 1 && !missing ? hclustComplete(rows.map(row => row.values as number[])) : null
  return { rows: tree ? tree.order.map(i => rows[i]) : rows, tree, missing }
}

export type HeatmapData = ReturnType<typeof heatmapData>

// Up to n DEGs per direction with the largest |log2FC| in comparison i (ties: smaller padj, then
// locus tag), listed from the largest log2FC to the most negative, as in the script's gene bars
export function topGenes(r: Results, statuses: Status[][], i: number, n = 10) {
  const lfc = (k: number) => r.genes[k].log2fc[i]!
  const pick = (dir: Status) => r.genes.map((_, k) => k)
    .filter(k => statuses[k][i] === dir)
    .sort((a, b) => Math.abs(lfc(b)) - Math.abs(lfc(a)) || r.genes[a].padj[i]! - r.genes[b].padj[i]! || byLocus(r, a, b))
    .slice(0, n)
  return [...pick("up"), ...pick("down")].sort((a, b) => lfc(b) - lfc(a))
}
