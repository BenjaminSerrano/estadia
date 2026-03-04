"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import VennDiagram from "@/components/venn-diagram"
import { ArrowRight, HelpCircle, Info, Database, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import Tutorial from "@/components/tutorial"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Corregir la importación de section-data
import { getSectionInfo, isIntersection, fetchSectionStats } from "@/lib/section-data"
import { getTablePathways, getComparisonTablePathways, mapSectionToComparisonTable } from "@/lib/api-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Importar el componente ThemeToggle
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [firstVisit, setFirstVisit] = useState(true)
  const [sectionStats, setSectionStats] = useState<{elements: number, uniqueProperties: number, pathwaysList?: string[], commonGenes?: string[]} | null>(null)
  const [loading, setLoading] = useState(false)
  const [pathways, setPathways] = useState<string[]>([])
  const [loadingPathways, setLoadingPathways] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()

  const handleSectionClick = async (section: string) => {
    setSelectedSection(section)
    setSelectedElement(null)
    setLoading(true)
    setLoadingPathways(true)

    try {
      // Try to get statistics from the backend
      const stats = await fetchSectionStats(section)
      setSectionStats(stats)

      // Get properties (pathways) for this section
      if (isIntersection(section)) {
        // For intersections, use comparison tables
        const comparisonTable = mapSectionToComparisonTable(section)
        if (comparisonTable) {
          const pathwaysData = await getComparisonTablePathways(comparisonTable)
          if (pathwaysData && pathwaysData.pathways) {
            setPathways(pathwaysData.pathways)
          }
        }
      } else {
        // Para conjuntos individuales, usar las tablas originales
        const tableName = section === "A" ? "16" : section === "B" ? "38" : section === "C" ? "41" : null
        if (tableName) {
          const pathwaysData = await getTablePathways(tableName)
          if (pathwaysData && pathwaysData.pathways) {
            setPathways(pathwaysData.pathways)
          }
        }
      }
    } catch (error) {
      console.error("Error obteniendo datos:", error)
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
    toast({
      title: "Selection reset",
      description: "You can select a new section of the diagram",
      duration: 3000,
    })
  }

  // Show tutorial on first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("venn-diagram-visited")
    if (!hasVisitedBefore && firstVisit) {
      setShowTutorial(true)
      localStorage.setItem("venn-diagram-visited", "true")
      setFirstVisit(false)
    }
  }, [firstVisit])

  // Get information from the selected section
  const sectionInfo = selectedSection ? getSectionInfo(selectedSection) : null

  // Get the selected detailed element
  const getSelectedElementDetails = () => {
    if (!selectedElement || !sectionInfo?.detailedElements) return null
    return sectionInfo.detailedElements.find((element) => element.id === selectedElement)
  }

  const elementDetails = getSelectedElementDetails()

  // Function to navigate to the detailed data page
  const handleViewData = () => {
    // Both intersections and individual sets require a selected element
    if (selectedSection && selectedElement) {
      toast({
        title: "Loading data",
        description: "Processing information, please wait...",
      })

      // Handle special case of "All data"
      const elementSlug = selectedElement === "__TODOS_LOS_DATOS__"
        ? "__TODOS_LOS_DATOS__"
        : selectedElement.replace(/ /g, '-').toLowerCase()
      console.log(`Navigating to /data/${selectedSection}/${elementSlug} to show filtered genes`)
      router.push(`/data/${selectedSection}/${elementSlug}`)
    } else {
      toast({
        title: "Selection required",
        description: "Please select a section and a specific element",
        variant: "destructive",
      })
    }
  }

  // Render information for normal sections (non-intersections)
  const renderNormalSectionInfo = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted border border-border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Elements:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">
                {sectionStats?.elements !== undefined
                  ? sectionStats.elements
                  : "Loading..."}
              </p>
            )}
          </div>
          <div className="bg-muted border border-border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Properties:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">
                {sectionStats?.uniqueProperties !== undefined
                  ? sectionStats.uniqueProperties
                  : "Loading..."}
              </p>
            )}
          </div>
        </div>


        {/* ── Pathway selector bar ── */}
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
                    pathways.map((pathway, index) => (
                      <SelectItem key={`normal-${pathway}-${index}`} value={pathway}>{pathway}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No properties available</SelectItem>
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
      </div>
    )
  }

  // Render information for specific elements
  const renderElementDetails = () => {
    return (
      <div className="space-y-4">
        <div className="bg-muted border border-border p-4 rounded-lg">
          <h3 className="font-medium mb-2">{elementDetails.name}</h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm">{elementDetails.description}</p>
        </div>

        <div className="bg-muted border border-border p-4 rounded-lg">
          <h3 className="font-medium mb-2">Properties:</h3>
          <ul className="space-y-1">
            {elementDetails?.properties?.map ? (
              elementDetails.properties.map((property, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-400 mt-1">•</span>
                  <span className="text-slate-700 dark:text-slate-300">{property}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2 text-sm">
                <span className="text-slate-400 mt-1">•</span>
                <span className="text-slate-700 dark:text-slate-300">Element property</span>
              </li>
            )}
          </ul>
        </div>

        <Button className="w-full" onClick={handleViewData}>
          <Database className="mr-2 h-4 w-4" />
          Review the data
        </Button>
      </div>
    )
  }

  // Render general information for intersections
  const renderIntersectionInfo = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted border border-border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Elements:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">
                {sectionStats?.elements !== undefined
                  ? sectionStats.elements
                  : "Loading..."}
              </p>
            )}
          </div>
          <div className="bg-muted border border-border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Properties:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">
                {sectionStats?.uniqueProperties !== undefined
                  ? sectionStats.uniqueProperties
                  : "Loading..."}
              </p>
            )}
          </div>
        </div>

        <div className="bg-muted border border-border p-4 rounded-lg">
          <h3 className="font-medium mb-2">Applications:</h3>
          <ul className="space-y-1">
            <li className="flex items-start gap-2 text-sm">
              <span className="text-slate-400 mt-1">•</span>
              <span className="text-slate-700 dark:text-slate-300">Comparative differential expression analysis</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-slate-400 mt-1">•</span>
              <span className="text-slate-700 dark:text-slate-300">Identification of common genes between conditions</span>
            </li>
          </ul>
        </div>

        <div>
          <label
            htmlFor="element-selector-intersection"
            className="block text-sm font-medium mb-2 text-red-500 dark:text-red-400"
          >
            * Select a property (pathway) to view data:
          </label>
          {loadingPathways ? (
            <div className="p-4 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-slate-500">Loading properties...</span>
            </div>
          ) : (
            <Select
              value={selectedElement || ""}
              onValueChange={(value) => setSelectedElement(value === "none" ? null : value)}
            >
              <SelectTrigger id="element-selector-intersection" className="w-full border-red-300 dark:border-red-700">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {pathways.length > 0 ? (
                  pathways.map((pathway, index) => (
                    <SelectItem key={`intersection-${pathway}-${index}`} value={pathway}>
                      {pathway}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No properties available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          {selectedElement && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-800 dark:text-blue-200 mb-2">
              Selected pathway: <strong>{selectedElement}</strong>
            </div>
          )}
          <Button className="w-full" onClick={handleViewData} disabled={!selectedElement}>
            <Database className="mr-2 h-4 w-4" />
            {selectedElement ? "View element data" : "Select an element first"}
          </Button>
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-[family-name:var(--font-display)] text-foreground tracking-tight">
                Interactive Venn Diagram
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl flex flex-wrap items-center gap-2">
                Explore the relationships between sets by clicking on any section of the diagram
                <span className="font-[family-name:var(--font-mono)] text-xs px-1.5 py-0.5 rounded border" style={{color:'hsl(var(--temp-cold))', borderColor:'hsl(var(--temp-cold) / 0.4)'}}>16°C</span>
                <span className="font-[family-name:var(--font-mono)] text-xs px-1.5 py-0.5 rounded border" style={{color:'hsl(var(--temp-warm))', borderColor:'hsl(var(--temp-warm) / 0.4)'}}>38°C</span>
                <span className="font-[family-name:var(--font-mono)] text-xs px-1.5 py-0.5 rounded border" style={{color:'hsl(var(--temp-hot))', borderColor:'hsl(var(--temp-hot) / 0.4)'}}>41°C</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setShowTutorial(true)}
                    aria-label="Show tutorial"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show tutorial</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => router.push("/solver")}
                    aria-label="Cobetia Solver"
                  >
                    <FlaskConical className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cobetia Solver</p>
                </TooltipContent>
              </Tooltip>

              {/* Usar el componente ThemeToggle correctamente */}
              <ThemeToggle />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left column: Venn Diagram */}
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

            {/* Right column: Information and selection */}
            <div className="space-y-6">
              {selectedSection ? (
                <Card className="shadow-lg">
                  <CardHeader className={`${sectionInfo?.color} rounded-t-lg`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {sectionInfo?.icon && typeof sectionInfo.icon === "function" ? sectionInfo.icon() : null}
                        <CardTitle className={`text-2xl ${sectionInfo?.accentColor}`}>{sectionInfo?.title}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={resetSelection}>
                        Change selection
                      </Button>
                    </div>
                    <CardDescription className="text-slate-700 dark:text-slate-300 mt-2">
                      {sectionInfo?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isIntersection(selectedSection) ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted border border-border p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Elements:</h3>
                            {loading ? (
                              <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <p className="font-[family-name:var(--font-mono)] text-3xl font-bold" style={{color:'hsl(var(--temp-cold))'}}>
                                {sectionStats?.elements !== undefined
                                  ? sectionStats.elements
                                  : "N/A"}
                              </p>
                            )}
                          </div>
                          <div className="bg-muted border border-border p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Properties:</h3>
                            {loading ? (
                              <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <p className="font-[family-name:var(--font-mono)] text-3xl font-bold text-green-600 dark:text-green-400">
                                {sectionStats?.uniqueProperties !== undefined
                                  ? sectionStats.uniqueProperties
                                  : "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ── Pathway selector bar ── */}
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
                                    pathways.map((pathway, index) => (
                                      <SelectItem key={`intersection-${pathway}-${index}`} value={pathway}>{pathway}</SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="none" disabled>No properties available</SelectItem>
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
                      </div>
                    ) : (
                      renderNormalSectionInfo()
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center p-8 border border-border rounded-2xl bg-card shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-[family-name:var(--font-mono)] text-sm px-3 py-1.5 rounded border" style={{color:'hsl(var(--temp-cold))', borderColor:'hsl(var(--temp-cold) / 0.4)', background:'hsl(var(--temp-cold) / 0.08)'}}>16°C — Cold</span>
                      <span className="font-[family-name:var(--font-mono)] text-sm px-3 py-1.5 rounded border" style={{color:'hsl(var(--temp-warm))', borderColor:'hsl(var(--temp-warm) / 0.4)', background:'hsl(var(--temp-warm) / 0.08)'}}>38°C — Warm</span>
                      <span className="font-[family-name:var(--font-mono)] text-sm px-3 py-1.5 rounded border" style={{color:'hsl(var(--temp-hot))', borderColor:'hsl(var(--temp-hot) / 0.4)', background:'hsl(var(--temp-hot) / 0.08)'}}>41°C — Hot</span>
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
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold mb-2" style={{color:'hsl(var(--temp-cold))'}}>1</p>
                    <h3 className="font-medium mb-1">Explore</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Hover over the different sections to see them highlighted
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted">
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold mb-2" style={{color:'hsl(var(--temp-warm))'}}>2</p>
                    <h3 className="font-medium mb-1">Select</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Click on any section of the diagram to view its information
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted">
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold mb-2" style={{color:'hsl(var(--temp-hot))'}}>3</p>
                    <h3 className="font-medium mb-1">Explore data</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      In intersections, select specific elements and review their data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-16 text-center pb-8">
            <p className="font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">Interactive Venn Diagram © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </TooltipProvider>
  )
}


