"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSectionInfo, sectionToConditions } from "@/lib/section-data"
import { getConditions, getGenes, type Gene, type Condition } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft, ChevronRight, Download, Search, X,
  ArrowUp, ArrowDown, ChevronsUpDown, Dna, AlertTriangle
} from "lucide-react"

const DATASET_ID = 1

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: string }) {
  if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 opacity-30 group-hover:opacity-60 transition-opacity" />
  return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-sky-400" /> : <ArrowDown className="h-3 w-3 text-sky-400" />
}

function formatLog2FC(n: number): string {
  const abs = Math.abs(n)
  if (abs === 0) return "0.000"
  if (abs >= 1e4 || (abs > 0 && abs < 1e-3)) return n.toExponential(9).toUpperCase()
  return n.toFixed(3)
}

function Log2Badge({ value }: { value: number | null | undefined }) {
  if (value == null || isNaN(value)) return <span className="text-muted-foreground/40">—</span>
  const color = value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-muted-foreground"
  return (
    <span className={`font-[family-name:var(--font-mono)] tabular-nums text-xs ${color}`}>
      {value > 0 ? "+" : ""}{formatLog2FC(value)}
    </span>
  )
}

function Badge({ text, variant }: { text: string; variant: "sky" | "violet" }) {
  const styles = { sky: "bg-sky-500/10 text-sky-300 border-sky-500/20", violet: "bg-violet-500/10 text-violet-300 border-violet-500/20" }
  return (
    <span className={`inline-block text-[10px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded border leading-tight ${styles[variant]}`}>
      {text}
    </span>
  )
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3 rounded-sm bg-muted animate-pulse" style={{ width: `${40 + ((i * 7 + j * 13) % 50)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ElementDataClient() {
  const router  = useRouter()
  const params  = useParams()
  const section = params.section as string
  const elementSlug = params.element as string
  const pathway = elementSlug === "__TODOS_LOS_DATOS__" ? "__TODOS_LOS_DATOS__" : elementSlug.replace(/-/g, " ")

  const [conditions, setConditions]   = useState<Condition[]>([])
  const [genesData, setGenesData]     = useState<Gene[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [serverTotal, setServerTotal] = useState<number | null>(null)
  const [searchTerm, setSearchTerm]   = useState("")
  const [sortField, setSortField]     = useState("Name")
  const [sortDir, setSortDir]         = useState("asc")
  const [page, setPage]               = useState(1)

  const PAGE_SIZE = 50

  // Conditions for this section: which to include, which to exclude
  const { include, exclude } = useMemo(() => sectionToConditions(section, conditions), [section, conditions])
  // Labels of included conditions (for expression columns)
  const includedLabels = useMemo(
    () => conditions.filter(c => include.includes(c.id)).map(c => c.label),
    [conditions, include]
  )

  const info = useMemo(() => getSectionInfo(section, conditions), [section, conditions])

  // Fetch conditions once, then genes
  useEffect(() => {
    getConditions(DATASET_ID).then(setConditions).catch(console.error)
  }, [])

  useEffect(() => {
    if (!include.length) return
    const fetchGenes = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getGenes(DATASET_ID, include, exclude, pathway)
        setGenesData(data.genes)
        setServerTotal(data.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data")
        setGenesData([])
      } finally {
        setLoading(false)
      }
    }
    fetchGenes()
  }, [include.join(','), exclude.join(','), pathway])

  const loadMore = async () => {
    if (loadingMore || genesData.length >= (serverTotal ?? 0)) return
    try {
      setLoadingMore(true)
      const data = await getGenes(DATASET_ID, include, exclude, pathway, genesData.length)
      setGenesData(prev => [...prev, ...data.genes])
      setServerTotal(data.total)
    } catch (err) {
      console.error("Error loading more genes:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { if (!info && !loading) router.push("/") }, [info, loading, router])

  // ─── Filter + sort ────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return genesData
      .filter(g => {
        if (!searchTerm) return true
        return [g.Name, g.KO_code, g.locustag]
          .some(f => f && f.toLowerCase().includes(searchTerm.toLowerCase()))
      })
      .sort((a, b) => {
        const av = (a as any)[sortField] ?? ""
        const bv = (b as any)[sortField] ?? ""
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
  }, [genesData, searchTerm, sortField, sortDir])

  useEffect(() => { setPage(1) }, [searchTerm, sortField, sortDir])

  const totalLoaded  = genesData.length
  const usePaginate  = filteredData.length >= PAGE_SIZE
  const totalPages   = usePaginate ? Math.ceil(filteredData.length / PAGE_SIZE) : 1
  const shownGenes   = usePaginate ? filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filteredData

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("asc") }
  }

  const getPageNums = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4)               return [1, 2, 3, 4, 5, "…", totalPages]
    if (page >= totalPages - 3)  return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, "…", page - 1, page, page + 1, "…", totalPages]
  }

  // ─── Column definitions ──────────────────────────────────────────────────
  const baseColumns = [
    { key: "Name",              label: "Gene",      mono: true  },
    { key: "KO_code",           label: "KO Code",   mono: true  },
    { key: "Protein_accession", label: "Accession", mono: true  },
    { key: "locustag",          label: "Locus Tag", mono: false },
  ]
  // One log2FC column per included condition
  const exprColumns = includedLabels.map(label => ({
    key: `expr_${label}`, label: `log2FC ${label}`, mono: true,
  }))
  const tailColumns = [
    { key: "Pathway",                  label: "Pathway",         mono: false },
    { key: "Brite_protein_families_1", label: "Protein Fam.",    mono: false },
    { key: "Brite_specific_family_1",  label: "Specific Fam.",   mono: false },
  ]
  const allColumns = [...baseColumns, ...exprColumns, ...tailColumns]

  const accentVar = section.startsWith("A") ? "var(--temp-cold)" : section.startsWith("B") ? "var(--temp-warm)" : "var(--temp-hot)"

  return (
    <div className="min-h-screen bg-background dot-grid">
      <div className="w-full px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/data/${section}?refresh=true`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground border border-border">
            <ChevronLeft className="h-4 w-4" />
            <span className="font-[family-name:var(--font-mono)] text-xs">{info?.title ?? section}</span>
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-[family-name:var(--font-display)] truncate text-foreground">
              {pathway === "__TODOS_LOS_DATOS__" ? (
                <>All genes — <span style={{ color: `hsl(${accentVar})` }}>{info?.title}</span></>
              ) : (
                <><span style={{ color: `hsl(${accentVar})` }}>{pathway}</span><span className="text-muted-foreground font-normal text-base ml-2">pathway</span></>
              )}
            </h1>
          </div>

          <Button variant="ghost" size="sm" onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground border border-border">
            <ChevronLeft className="h-4 w-4" />
            <span className="font-[family-name:var(--font-mono)] text-xs">Diagram</span>
          </Button>
        </div>

        {/* ── Table ── */}
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-lg">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/60 flex-wrap">
            <div className="relative flex items-center flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search gene, KO code, locus…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-background border border-border rounded-md font-[family-name:var(--font-mono)] text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground ml-auto whitespace-nowrap">
              {loading ? <span className="animate-pulse">Loading…</span> : (
                <>
                  <span className="text-foreground">{shownGenes.length}</span>
                  {filteredData.length !== totalLoaded && <> of <span className="text-foreground">{filteredData.length}</span> filtered</>}
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-foreground">{totalLoaded}</span>
                  <span className="text-muted-foreground"> genes</span>
                </>
              )}
            </div>

            <Button variant="outline" size="sm" className="h-7 gap-1.5 font-[family-name:var(--font-mono)] text-xs">
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>

          {/* Table */}
          <div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/80 border-b border-border">
                  {allColumns.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      className="group px-4 py-2.5 text-left cursor-pointer select-none border-r border-border/40 last:border-r-0 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                          {col.label}
                        </span>
                        <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                      </div>
                      <div className={`h-px mt-1 bg-sky-400 transition-all duration-200 ${sortField === col.key ? "opacity-100" : "opacity-0"}`} />
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <SkeletonRows cols={allColumns.length} />
                ) : error ? (
                  <tr>
                    <td colSpan={allColumns.length} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-full border border-red-500/30 bg-red-500/10">
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                        <p className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                          <span className="text-red-400">&gt; ERROR:</span> {error}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                          <Button size="sm" variant="ghost" onClick={() => router.push("/")}>Back to diagram</Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={allColumns.length} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full border border-border bg-muted">
                          {searchTerm ? <Search className="h-7 w-7 text-muted-foreground" /> : <Dna className="h-7 w-7 text-muted-foreground" />}
                        </div>
                        <div className="font-[family-name:var(--font-mono)]">
                          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest mb-1">
                            {searchTerm ? "No results found" : "No data available"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {searchTerm ? `> no genes matching "${searchTerm}"` : `> no genes for pathway "${pathway}"`}
                          </p>
                        </div>
                        {searchTerm && (
                          <Button size="sm" variant="outline" onClick={() => setSearchTerm("")} className="text-xs font-[family-name:var(--font-mono)]">
                            Clear filter
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  shownGenes.map((gene, index) => (
                    <tr
                      key={`${gene.id}-${index}`}
                      className="group border-b border-border/60 border-l-2 border-l-transparent hover:border-l-sky-400 hover:bg-muted/40 transition-all duration-100 animate-fadeIn"
                      style={{ animationDelay: `${Math.min(index * 18, 280)}ms` }}
                    >
                      <td className="px-4 py-2.5 font-semibold text-foreground group-hover:text-white transition-colors">
                        {gene.Name || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {gene.KO_code ? (
                          <a href={`https://www.kegg.jp/entry/${gene.KO_code}`} target="_blank" rel="noopener noreferrer"
                            className="font-[family-name:var(--font-mono)] text-xs text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                            {gene.KO_code}
                          </a>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                        {gene.Protein_accession || <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                        {gene.locustag || <span className="opacity-40">—</span>}
                      </td>

                      {/* One log2FC column per included condition */}
                      {includedLabels.map(label => (
                        <td key={label} className="px-4 py-2.5 text-right">
                          <Log2Badge value={gene.expression?.[label]?.log2FoldChange} />
                        </td>
                      ))}

                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {gene.Pathway || <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          {[gene.Brite_protein_families_1, gene.Brite_protein_families_2, gene.Brite_protein_families_3]
                            .filter(v => v && v !== "-")
                            .map((v, i) => <Badge key={i} text={v} variant="sky" />)}
                          {!gene.Brite_protein_families_1 && <span className="text-muted-foreground/40 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          {[gene.Brite_specific_family_1, gene.Brite_specific_family_2, gene.Brite_specific_family_3]
                            .filter(v => v && v !== "-")
                            .map((v, i) => <Badge key={i} text={v} variant="violet" />)}
                          {!gene.Brite_specific_family_1 && <span className="text-muted-foreground/40 text-xs">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          {!loading && !error && filteredData.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/40 flex-wrap gap-2">
              <p className="font-[family-name:var(--font-mono)] text-[11px] text-muted-foreground">
                {usePaginate ? (
                  <>
                    <span className="text-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredData.length)}</span>
                    <span className="text-muted-foreground"> of </span>
                    <span className="text-foreground">{filteredData.length}</span>
                    {filteredData.length !== totalLoaded && <span className="text-muted-foreground"> (filtered)</span>}
                    <span className="text-muted-foreground"> · {totalLoaded} loaded</span>
                    {serverTotal != null && totalLoaded < serverTotal && <span className="text-muted-foreground"> of {serverTotal} total</span>}
                  </>
                ) : (
                  <span className="text-foreground/60">
                    {totalLoaded} loaded
                    {serverTotal != null && totalLoaded < serverTotal && ` of ${serverTotal} total`}
                  </span>
                )}
              </p>

              {usePaginate && (
                <div className="flex items-center gap-0.5 font-[family-name:var(--font-mono)] text-[11px]">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-7 w-7 flex items-center justify-center rounded border border-border/60 bg-transparent hover:bg-muted transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  {getPageNums().map((n, i) =>
                    n === "…" ? (
                      <span key={`e-${i}`} className="h-7 w-7 flex items-center justify-center text-muted-foreground/50">···</span>
                    ) : (
                      <button key={n} onClick={() => setPage(n as number)}
                        className={`h-7 w-7 flex items-center justify-center rounded border transition-colors ${
                          page === n ? "border-sky-500/60 bg-sky-500/10 text-sky-400" : "border-border/60 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}>
                        {n}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="h-7 w-7 flex items-center justify-center rounded border border-border/60 bg-transparent hover:bg-muted transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Load more */}
          {!loading && !error && serverTotal != null && totalLoaded < serverTotal && (
            <div className="flex justify-center py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}
                className="font-[family-name:var(--font-mono)] text-xs gap-2">
                {loadingMore ? <span className="animate-pulse">Loading…</span> : (
                  <>Load more <span className="text-muted-foreground">({serverTotal - totalLoaded} remaining)</span></>
                )}
              </Button>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center pb-8">
          <p className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
            Interactive Venn Diagram © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}
