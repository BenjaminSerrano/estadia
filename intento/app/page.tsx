"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import VennDiagram from "@/components/venn-diagram"
import { ArrowRight, HelpCircle, Info, Database } from "lucide-react"
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
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Elementos:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold">
                {sectionStats?.elements !== undefined
                  ? sectionStats.elements
                  : "Loading..."}
              </p>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Propiedades:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold">
                {sectionStats?.uniqueProperties !== undefined
                  ? sectionStats.uniqueProperties
                  : "Loading..."}
              </p>
            )}
          </div>
        </div>


        <div>
          <label
            htmlFor="element-selector-normal"
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
              <SelectTrigger id="element-selector-normal" className="w-full border-red-300 dark:border-red-700">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-data" value="__TODOS_LOS_DATOS__">
                  All data
                </SelectItem>
                {pathways.length > 0 ? (
                  pathways.map((pathway, index) => (
                    <SelectItem key={`normal-${pathway}-${index}`} value={pathway}>
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
{selectedElement === "__TODOS_LOS_DATOS__" ? (
                <>Showing: <strong>All table data</strong></>
              ) : (
                <>Selected pathway: <strong>{selectedElement}</strong></>
              )}
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

  // Render information for specific elements
  const renderElementDetails = () => {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
          <h3 className="font-medium mb-2">{elementDetails.name}</h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm">{elementDetails.description}</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
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
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Elements:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold">
                {sectionStats?.elements !== undefined
                  ? sectionStats.elements
                  : "Loading..."}
              </p>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Properties:</h3>
            {loading ? (
              <div className="flex items-center justify-center h-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold">
                {sectionStats?.uniqueProperties !== undefined
                  ? sectionStats.uniqueProperties
                  : "Loading..."}
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                Interactive Venn Diagram
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                Explore the relationships between sets by clicking on any section of the diagram
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

              {/* Usar el componente ThemeToggle correctamente */}
              <ThemeToggle />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left column: Venn Diagram */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
                <Info size={18} />
                <p className="text-sm">Click on any section to see details</p>
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
                          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Elements:</h3>
                            {loading ? (
                              <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {sectionStats?.elements !== undefined
                                  ? sectionStats.elements
                                  : "N/A"}
                              </p>
                            )}
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Properties:</h3>
                            {loading ? (
                              <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {sectionStats?.uniqueProperties !== undefined
                                  ? sectionStats.uniqueProperties
                                  : "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                          <label
                            htmlFor="intersection-pathway-selector"
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
                              <SelectTrigger id="intersection-pathway-selector" className="w-full border-red-300 dark:border-red-700">
                                <SelectValue placeholder="Select a property" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="all-data-intersection" value="__TODOS_LOS_DATOS__">
                                  All data
                                </SelectItem>
                                {pathways.length > 0 ? (
                                  pathways.map((pathway, index) => (
                                    <SelectItem key={index} value={pathway}>
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
                          {selectedElement && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-800 dark:text-blue-200 mt-2">
                              Selected pathway: <strong>{selectedElement}</strong>
                            </div>
                          )}
                        </div>

                        <Button className="w-full" onClick={handleViewData} disabled={!selectedElement}>
                          <Database className="mr-2 h-4 w-4" />
                          {selectedElement ? "View element data" : "Select an element first"}
                        </Button>
                      </div>
                    ) : (
                      renderNormalSectionInfo()
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center p-8 border rounded-2xl bg-white/50 dark:bg-slate-800/50 shadow-lg backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                      <Info className="w-8 h-8 text-slate-400 dark:text-slate-300" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                      Select a section of the Venn diagram to view detailed information
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 animate-pulse">
                      <p>Select a section</p>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">How to use this diagram?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 dark:text-purple-300 font-bold">1</span>
                    </div>
                    <h3 className="font-medium mb-1 text-center">Explore</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm text-center">
                      Hover over the different sections to see them highlighted
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">2</span>
                    </div>
                    <h3 className="font-medium mb-1 text-center">Select</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm text-center">
                      Click on any section of the diagram to view its information
                    </p>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800/30">
                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-pink-600 dark:text-pink-300 font-bold">3</span>
                    </div>
                    <h3 className="font-medium mb-1 text-center">Explore data</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm text-center">
                      In intersections, select specific elements and review their data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-16 text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
            <p>Interactive Venn Diagram © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </TooltipProvider>
  )
}

