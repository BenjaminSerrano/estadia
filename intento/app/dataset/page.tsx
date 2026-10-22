"use client"

import { Suspense, useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import VennDiagram from "@/components/venn-diagram"
import { ArrowRight, ChevronLeft, HelpCircle, Info, FlaskConical, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Tutorial from "@/components/tutorial"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSectionInfo, sectionToConditions } from "@/lib/section-data"
import { getConditions, getStats, getPathways, getResults, listDatasets, type Condition, type Dataset, type Direction, type Results } from "@/lib/api-service"
import { directionCounts, formatCondition, heatmapData, isOpposite, jointTable, regionCounts, statusMatrix, STATUS_LABEL, topGenes, type RankBy } from "@/lib/deg"
import { downloadCsv } from "@/lib/export-figure"
import FigureCard from "@/components/figure-card"
import VennFigure from "@/components/figures/venn-figure"
import DegBars from "@/components/figures/deg-bars"
import Heatmap from "@/components/figures/heatmap"
import GeneBars from "@/components/figures/gene-bars"
import Volcano from "@/components/figures/volcano"
import Segmented from "@/components/segmented"

const TOP_GENES = 10
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DatasetPage() {
  return (
    <Suspense fallback={null}>
      <VennPage />
    </Suspense>
  )
}

function VennPage() {
  const router = useRouter()
  const datasetId = Number(useSearchParams().get("id"))

  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [firstVisit, setFirstVisit] = useState(true)
  const [sectionStats, setSectionStats] = useState<{ elements: number; uniqueProperties: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [pathways, setPathways] = useState<string[]>([])
  const [loadingPathways, setLoadingPathways] = useState(false)
  // Venn sets = comparisons vs the control; the control itself has no DEGs of its own
  const [conditions, setConditions] = useState<Condition[]>([])
  const [control, setControl] = useState<Condition | null>(null)
  const [conditionsLoaded, setConditionsLoaded] = useState(false)
  // All genes x comparisons, for the region counts, the figures and the CSV downloads
  const [results, setResults] = useState<Results | null>(null)
  const [direction, setDirection] = useState<Direction>("")
  // Heatmap options (defaults from the issue's script) and the comparison shown in the per-comparison figures
  const [heatmapTop, setHeatmapTop] = useState(100)
  const [rankBy, setRankBy] = useState<RankBy>("padj")
  const [colorLimit, setColorLimit] = useState(3)
  const [comparison, setComparison] = useState(0)
  const { toast } = useToast()

  // Redirect back home if no valid dataset id
  useEffect(() => {
    if (!Number.isFinite(datasetId) || datasetId <= 0) router.replace("/")
  }, [datasetId, router])

  // Dataset metadata (for the title) + conditions
  useEffect(() => {
    if (!datasetId) return
    listDatasets().then(ds => setDataset(ds.find(d => d.id === datasetId) ?? null)).catch(console.error)
    getConditions(datasetId)
      .then(c => {
        setConditions(c.filter(x => !x.is_baseline))
        setControl(c.find(x => x.is_baseline) ?? null)
        setConditionsLoaded(true)
      })
      .catch(() => setConditionsLoaded(true))
    getResults(datasetId).then(setResults).catch(console.error)
  }, [datasetId])

  const statuses = useMemo(() => results ? statusMatrix(results) : [], [results])
  const counts = useMemo(() => results ? regionCounts(statuses, direction) : undefined, [results, statuses, direction])
  const opposite = useMemo(() => statuses.filter(isOpposite).length, [statuses])
  const heatmap = useMemo(() => results ? heatmapData(results, statuses, heatmapTop, rankBy) : null, [results, statuses, heatmapTop, rankBy])
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  const fileBase = slug(dataset?.name ?? `dataset_${datasetId}`)
  const comparisonLabel = results?.comparisons[comparison]?.label ?? ""

  // Heatmap rows as shown (clustered order) with their unscaled values, like the script's ranking/matrix tables
  const downloadHeatmapCsv = () => {
    if (!results || !heatmap) return
    const vs = (l: string) => results.control ? `${l}_vs_${results.control}` : l
    downloadCsv([
      ["row", "rank", "locus_tag", "product", "min_padj", "max_abs_log2FC",
        ...results.comparisons.flatMap(c => [`log2FC_${vs(c.label)}`, `class_${vs(c.label)}`])],
      ...heatmap.rows.map((row, i) => [
        i + 1, row.rank, results.genes[row.k].locustag, results.genes[row.k].name, row.minPadj, row.maxAbsLfc,
        ...results.comparisons.flatMap((_, j) => [results.genes[row.k].log2fc[j], STATUS_LABEL[statuses[row.k][j]]]),
      ]),
    ], `${fileBase}_heatmap_genes.csv`)
  }

  const handleSectionClick = async (section: string) => {
    setSelectedSection(section)
    setSelectedElement(null)
    setLoading(true)
    setLoadingPathways(true)

    try {
      const { include, exclude } = sectionToConditions(section, conditions)
      const [stats, pathwaysData] = await Promise.all([
        getStats(datasetId, include, exclude, direction),
        getPathways(datasetId, include, exclude, direction),
      ])
      setSectionStats({ elements: stats.total_genes, uniqueProperties: stats.unique_pathways })
      setPathways(pathwaysData.pathways)
    } catch (error) {
      console.error("Error fetching section data:", error)
      setSectionStats(null)
      setPathways([])
    } finally {
      setLoading(false)
      setLoadingPathways(false)
    }
  }

  const resetSelection = () => {
    setSelectedSection(null)
    setSelectedElement(null)
    toast({ title: "Selection reset", description: "You can select a new section of the diagram", duration: 3000 })
  }

  useEffect(() => {
    const hasVisited = localStorage.getItem("venn-diagram-visited")
    if (!hasVisited && firstVisit) {
      setShowTutorial(true)
      localStorage.setItem("venn-diagram-visited", "true")
      setFirstVisit(false)
    }
  }, [firstVisit])

  // The region's genes for another direction are a different set: start the selection over
  const changeDirection = (d: Direction) => {
    setDirection(d)
    setSelectedSection(null)
    setSelectedElement(null)
  }

  const handleViewData = () => {
    if (selectedSection && selectedElement) {
      toast({ title: "Loading data", description: "Processing information, please wait..." })
      // Query params, not route segments: the static export only has pages known at build time
      const q = new URLSearchParams({ dataset: String(datasetId), section: selectedSection })
      if (direction) q.set("dir", direction)
      if (selectedElement !== "__TODOS_LOS_DATOS__") q.set("pathway", selectedElement)
      router.push(`/genes/?${q}`)
    } else {
      toast({ title: "Selection required", description: "Please select a section and a specific element", variant: "destructive" })
    }
  }

  const sectionInfo = selectedSection ? getSectionInfo(selectedSection, conditions, direction) : null

  const Spinner = () => (
    <div className="flex items-center justify-center h-8">
      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
    </div>
  )

  const PathwaySelector = () => (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-3 py-1.5 bg-muted/80 border-b border-border/60 flex items-center gap-2">
        <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-muted-foreground">Pathway</span>
        {selectedElement && (
          <span className="ml-auto font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-sky-400">ready</span>
        )}
      </div>
      {loadingPathways ? (
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <div className="flex">
          <Select
            value={selectedElement || ""}
            onValueChange={(value) => setSelectedElement(value === "none" ? null : value)}
          >
            <SelectTrigger className="flex-1 border-0 rounded-none shadow-none focus:ring-0 font-[family-name:var(--font-mono)] text-sm h-11 bg-transparent">
              <SelectValue placeholder="— select a pathway —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__TODOS_LOS_DATOS__">All data</SelectItem>
              {pathways.length > 0 ? (
                pathways.map((pathway, i) => (
                  <SelectItem key={i} value={pathway}>{pathway}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No pathways available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <button
            onClick={handleViewData}
            disabled={!selectedElement}
            className="px-4 border-l border-border/60 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs transition-colors disabled:opacity-25 disabled:cursor-not-allowed bg-muted/40 hover:bg-muted text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )

  const condColors = ['var(--temp-cold)', 'var(--temp-warm)', 'var(--temp-hot)']

  if (conditionsLoaded && (conditions.length < 1 || conditions.length > 3)) {
    return (
      <div className="min-h-screen bg-background dot-grid flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-slate-600 dark:text-slate-300">
            The Venn view currently supports datasets with 1 to 3 conditions compared against the control.
            {dataset ? ` "${dataset.name}"` : " This dataset"} has {conditions.length}
            {control ? ` (control: ${control.label})` : ""}.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>Back to datasets</Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background dot-grid transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}
                className="mb-3 gap-1.5 text-muted-foreground hover:text-foreground border border-border">
                <ChevronLeft className="h-4 w-4" />
                <span className="font-[family-name:var(--font-mono)] text-xs">All datasets</span>
              </Button>
              <h1 className="text-4xl md:text-5xl font-bold mb-1 font-[family-name:var(--font-display)] text-foreground tracking-tight">
                {dataset?.name ?? "Loading dataset…"}
              </h1>
              {dataset?.organism && (
                <p className="text-base text-slate-500 dark:text-slate-400 font-[family-name:var(--font-display)] mb-3 italic">
                  {dataset.organism}
                </p>
              )}
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl flex flex-wrap items-center gap-2">
                Explore the relationships between sets by clicking on any section of the diagram
                {conditions.map((c, i) => (
                  <span
                    key={c.id}
                    className="font-[family-name:var(--font-mono)] text-xs px-1.5 py-0.5 rounded border"
                    style={{ color: `hsl(${condColors[i]})`, borderColor: `hsl(${condColors[i]} / 0.4)` }}
                  >
                    {c.label}
                  </span>
                ))}
                {control && (
                  <span className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">vs control {control.label}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setShowTutorial(true)} aria-label="Show tutorial">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Show tutorial</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => router.push("/solver")} aria-label="Cobetia Solver">
                    <FlaskConical className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Cobetia Solver</p></TooltipContent>
              </Tooltip>

              <ThemeToggle />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Venn Diagram */}
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6 transition-all duration-300 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Info size={18} />
                  <p className="text-sm">Click on any section to see details</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-[family-name:var(--font-mono)] text-muted-foreground border border-border rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Interactive
                </span>
              </div>
              <div className="mb-4">
                <Segmented label="Direction of change" value={direction} onChange={changeDirection}
                  options={[["", "All DEGs"], ["up", "Upregulated"], ["down", "Downregulated"]]} />
              </div>
              <VennDiagram onSectionClick={handleSectionClick} selectedSection={selectedSection} labels={conditions.map(c => c.label)} counts={counts} />
              {direction === "" && opposite > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {opposite} gene{opposite > 1 ? "s go" : " goes"} up in one comparison and down in another; the shared regions count {opposite > 1 ? "them" : "it"} regardless of direction.
                  Use Upregulated / Downregulated to separate them.
                </p>
              )}
            </div>

            {/* Right: Info panel */}
            <div className="space-y-6">
              {selectedSection ? (
                <Card className="shadow-lg">
                  <CardHeader className={`${sectionInfo?.color} rounded-t-lg`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {sectionInfo?.icon && <sectionInfo.icon className="w-6 h-6 text-current opacity-70" />}
                        <CardTitle className={`text-2xl ${sectionInfo?.accentColor}`}>{sectionInfo?.title}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={resetSelection}>Change selection</Button>
                    </div>
                    <CardDescription className="text-slate-700 dark:text-slate-300 mt-2">
                      {sectionInfo?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted border border-border p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Genes:</h3>
                          {loading ? <Spinner /> : (
                            <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">
                              {sectionStats?.elements ?? 'N/A'}
                            </p>
                          )}
                        </div>
                        <div className="bg-muted border border-border p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Pathways:</h3>
                          {loading ? <Spinner /> : (
                            <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">
                              {sectionStats?.uniqueProperties ?? 'N/A'}
                            </p>
                          )}
                        </div>
                      </div>
                      <PathwaySelector />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center p-8 border border-border rounded-2xl bg-card shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-2">
                      {conditions.map((c, i) => (
                        <span
                          key={c.id}
                          className="font-[family-name:var(--font-mono)] text-sm px-3 py-1.5 rounded border"
                          style={{ color: `hsl(${condColors[i]})`, borderColor: `hsl(${condColors[i]} / 0.4)`, background: `hsl(${condColors[i]} / 0.08)` }}
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs text-sm">
                      Select a region of the diagram to explore gene data
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 animate-pulse">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card border border-border p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">How to use this diagram?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-muted">
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold mb-2" style={{ color: `hsl(${condColors[0]})` }}>1</p>
                    <h3 className="font-medium mb-1">Explore</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Hover over the different sections to see them highlighted</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted">
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold mb-2" style={{ color: `hsl(${condColors[1]})` }}>2</p>
                    <h3 className="font-medium mb-1">Select</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Click on any section of the diagram to view its information</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted">
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold mb-2" style={{ color: `hsl(${condColors[2]})` }}>3</p>
                    <h3 className="font-medium mb-1">Explore data</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Select a pathway and explore the gene data table</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {results && results.comparisons.length > 0 && (
            <section className="mt-12 space-y-6">
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">Figures and downloads</h2>
              <FigureCard title="Venn diagram by direction" name={`${fileBase}_venn_up_down`}>
                <VennFigure
                  labels={results.comparisons.map(c => c.label)}
                  control={results.control}
                  thresholds={results.thresholds}
                  up={regionCounts(statuses, "up")}
                  down={regionCounts(statuses, "down")}
                />
              </FigureCard>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <FigureCard title="DEGs per comparison" name={`${fileBase}_deg_counts`}>
                  <DegBars
                    labels={results.comparisons.map(c => c.label)}
                    control={results.control}
                    thresholds={results.thresholds}
                    counts={directionCounts(statuses, results.comparisons.length)}
                  />
                </FigureCard>
                <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-4">
                  <h3 className="font-semibold">Tables</h3>
                  <div className="space-y-1">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadCsv(jointTable(results, statuses), `${fileBase}_joint_table.csv`)}>
                      <Download className="h-3.5 w-3.5" /> Joint table (CSV)
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      All {results.genes.length} genes: log2FC, padj and classification at each comparison vs control
                      {results.control ? ` ${results.control}` : ""}, number of comparisons where the gene is a DEG and whether it changes sign.
                    </p>
                  </div>
                  {results.comparisons.length > 1 && (
                    <div className="space-y-1">
                      <Button variant="outline" size="sm" className="gap-1.5" disabled={!opposite}
                        onClick={() => downloadCsv(jointTable(results, statuses, isOpposite), `${fileBase}_opposite_direction_genes.csv`)}>
                        <Download className="h-3.5 w-3.5" /> Opposite-direction genes ({opposite})
                      </Button>
                      <p className="text-xs text-muted-foreground">Upregulated in one comparison and downregulated in another.</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground border-t border-border pt-3">
                    DEG: padj &lt; {results.thresholds.padj} and |log2FC| ≥ {results.thresholds.log2fc}. &quot;Not evaluable&quot; = no log2FC or padj
                    (e.g. DESeq2 independent filtering, or genes not reported in a curated dataset).
                  </p>
                </div>
              </div>

              {heatmap && (
                <FigureCard title="Heatmap" name={`${fileBase}_heatmap_log2fc`} controls={
                  <>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-muted-foreground">Genes</span>
                    <Segmented label="Number of genes" value={heatmapTop} onChange={setHeatmapTop}
                      options={[[25, "25"], [50, "50"], [100, "100"], [200, "200"]]} />
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-muted-foreground">Rank by</span>
                    <Segmented label="Rank genes by" value={rankBy} onChange={setRankBy}
                      options={[["padj", "smallest padj"], ["lfc", "largest |log2FC|"]]} />
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-muted-foreground">Color scale</span>
                    <Segmented label="Color scale limit" value={colorLimit} onChange={setColorLimit}
                      options={[[2, "±2"], [3, "±3"], [5, "±5"]]} />
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 font-[family-name:var(--font-mono)] text-xs ml-auto"
                      onClick={downloadHeatmapCsv} disabled={!heatmap.rows.length}>
                      <Download className="h-3 w-3" /> Genes (CSV)
                    </Button>
                  </>
                }>
                  {heatmap.rows.length
                    ? <Heatmap results={results} data={heatmap} limit={colorLimit} rankBy={rankBy} />
                    : <p className="text-sm text-slate-600 p-6 text-center">No DEGs in this dataset.</p>}
                </FigureCard>
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold mr-2">Per comparison</h3>
                  {results.comparisons.length > 1 && (
                    <Segmented label="Comparison" value={comparison} onChange={setComparison}
                      options={results.comparisons.map((c, i) => [i, formatCondition(c.label)] as [number, string])} />
                  )}
                </div>
                <div className="space-y-6">
                  <FigureCard title="Largest changes" name={`${fileBase}_top_genes_${slug(comparisonLabel)}`}>
                    <GeneBars results={results} index={comparison} perDirection={TOP_GENES}
                      genes={topGenes(results, statuses, comparison, TOP_GENES)} />
                  </FigureCard>
                  <FigureCard title="Volcano plot" name={`${fileBase}_volcano_${slug(comparisonLabel)}`}>
                    <Volcano results={results} statuses={statuses} index={comparison} />
                  </FigureCard>
                </div>
              </div>
            </section>
          )}

          <footer className="mt-16 text-center pb-8">
            <p className="font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">Proyecto ANID Exploración 13220184</p>
          </footer>
        </div>
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </TooltipProvider>
  )
}
