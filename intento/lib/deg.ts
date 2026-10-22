import type { Direction, Results } from "./api-service"

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

export const SECTION_LETTERS = "ABC"

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
