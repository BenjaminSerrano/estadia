"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import VennDiagram from "@/components/venn-diagram"
import { ArrowRight, HelpCircle, Info, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Tutorial from "@/components/tutorial"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSectionInfo, sectionToConditions } from "@/lib/section-data"
import { getConditions, getStats, getPathways, listDatasets, type Condition, type Dataset } from "@/lib/api-service"
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
  const [conditions, setConditions] = useState<Condition[]>([])
  const [conditionsLoaded, setConditionsLoaded] = useState(false)
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
      .then(c => { setConditions(c); setConditionsLoaded(true) })
      .catch(() => setConditionsLoaded(true))
  }, [datasetId])

  const handleSectionClick = async (section: string) => {
    setSelectedSection(section)
    setSelectedElement(null)
    setLoading(true)
    setLoadingPathways(true)

    try {
      const { include, exclude } = sectionToConditions(section, conditions)
      const [stats, pathwaysData] = await Promise.all([
        getStats(datasetId, include, exclude),
        getPathways(datasetId, include, exclude),
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

  const handleViewData = () => {
    if (selectedSection && selectedElement) {
      toast({ title: "Loading data", description: "Processing information, please wait..." })
      const elementSlug = selectedElement === "__TODOS_LOS_DATOS__"
        ? "__TODOS_LOS_DATOS__"
        : selectedElement.replace(/ /g, '-').toLowerCase()
      router.push(`/data/${selectedSection}/${elementSlug}/?dataset=${datasetId}`)
    } else {
      toast({ title: "Selection required", description: "Please select a section and a specific element", variant: "destructive" })
    }
  }

  const sectionInfo = selectedSection ? getSectionInfo(selectedSection, conditions) : null

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

  if (conditionsLoaded && conditions.length !== 3) {
    return (
      <div className="min-h-screen bg-background dot-grid flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-slate-600 dark:text-slate-300">
            The Venn view currently supports datasets with exactly 3 conditions.
            {dataset ? ` "${dataset.name}"` : " This dataset"} has {conditions.length}.
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
              <VennDiagram onSectionClick={handleSectionClick} selectedSection={selectedSection} />
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

          <footer className="mt-16 text-center pb-8">
            <p className="font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">Proyecto ANID Exploración 13220184</p>
          </footer>
        </div>
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </TooltipProvider>
  )
}
