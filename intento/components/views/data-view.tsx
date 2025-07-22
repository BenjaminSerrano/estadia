"use client"

import type React from "react"

import { Database, Filter, Download, ArrowUpDown, Search } from "lucide-react"
import { getSectionInfo, isIntersection, fetchSectionStats } from "@/lib/section-data"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataViewProps {
  section: string
  navigationBar: React.ReactNode
}

export default function DataView({ section, navigationBar }: DataViewProps) {
  const info = getSectionInfo(section)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [stats, setStats] = useState<{elements: number, uniqueProperties: number, pathwaysList?: string[], commonGenes?: string[]} | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar estadísticas de la API cuando cambie la sección
  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      try {
        const sectionStats = await fetchSectionStats(section)
        setStats(sectionStats)
      } catch (error) {
        console.error("Error cargando estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [section])

  // Obtener el elemento detallado seleccionado
  const getSelectedElementDetails = () => {
    if (!selectedElement || !info.detailedElements) return null
    return info.detailedElements.find((element: any) => element.id === selectedElement)
  }

  const elementDetails = getSelectedElementDetails()

  // Filtrar y ordenar los datos
  const filteredAndSortedData = [...info.data]
    // Filtrar por término de búsqueda
    .filter(
      (item) =>
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    // Filtrar por categoría
    .filter((item) => filterCategory === "all" || item.category === filterCategory)
    // Ordenar por campo y dirección
    .sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField as keyof typeof a] > b[sortField as keyof typeof b] ? 1 : -1
      } else {
        return a[sortField as keyof typeof a] < b[sortField as keyof typeof b] ? 1 : -1
      }
    })

  // Obtener categorías únicas para el filtro
  const uniqueCategories = Array.from(new Set(info.data.map((item) => item.category)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {navigationBar}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h1 className="text-3xl font-bold">Datos: {info.title}</h1>
          </div>

          {/* Dropdown para seleccionar elementos específicos en intersecciones */}
          {isIntersection(section) && (
            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium mb-2">Genes en la intersección:</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {loading ? (
                      <span className="inline-block w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></span>
                    ) : (
                      stats?.elements || "0"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Rutas metabólicas:</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {loading ? (
                      <span className="inline-block w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></span>
                    ) : (
                      stats?.uniqueProperties || "0"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Estado:</p>
                  <p className="text-sm">
                    {loading ? (
                      <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                        Cargando...
                      </span>
                    ) : stats?.elements && stats.elements > 0 ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                        Datos disponibles
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                        Sin datos
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <label htmlFor="pathway-selector" className="block text-sm font-medium mb-2">
                Seleccionar ruta metabólica:
              </label>
              <Select value={selectedElement || ""} onValueChange={(value) => setSelectedElement(value)}>
                <SelectTrigger id="pathway-selector" className="w-full">
                  <SelectValue placeholder="Seleccionar una ruta metabólica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las rutas</SelectItem>
                  {stats?.pathwaysList?.map((pathway, index) => (
                    <SelectItem key={index} value={pathway}>
                      {pathway}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o categoría..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="value">Valor</SelectItem>
                      <SelectItem value="category">Categoría</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  aria-label={sortDirection === "asc" ? "Ordenar descendente" : "Ordenar ascendente"}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedElement && elementDetails ? (
              <div>
                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg mb-4">
                  <h2 className="text-lg font-medium mb-2">{elementDetails.name}</h2>
                  <p className="text-slate-700 dark:text-slate-300 mb-4">{elementDetails.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {elementDetails.properties.map((property: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">
                        {property}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-700">
                        <th className="p-3 text-left text-sm font-medium">Atributo</th>
                        <th className="p-3 text-left text-sm font-medium">Valor</th>
                        <th className="p-3 text-left text-sm font-medium">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elementDetails.detailedData.map((data: any, index: number) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white/50 dark:bg-slate-800/50" : "bg-slate-50/50 dark:bg-slate-700/50"
                          }
                        >
                          <td className="p-3 text-sm font-medium">{data.attribute}</td>
                          <td className="p-3 text-sm">{data.value}</td>
                          <td className="p-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                data.type === "Cuantitativo"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : data.type === "Cualitativo"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : data.type === "Ordinal"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {data.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700">
                      <th className="p-3 text-left text-sm font-medium">ID</th>
                      <th className="p-3 text-left text-sm font-medium">Nombre</th>
                      <th className="p-3 text-left text-sm font-medium">Valor</th>
                      <th className="p-3 text-left text-sm font-medium">Categoría</th>
                      <th className="p-3 text-left text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedData.length > 0 ? (
                      filteredAndSortedData.map((item, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white/50 dark:bg-slate-800/50" : "bg-slate-50/50 dark:bg-slate-700/50"
                          }
                        >
                          <td className="p-3 text-sm">{item.id}</td>
                          <td className="p-3 text-sm">{item.name}</td>
                          <td className="p-3 text-sm">{item.value}</td>
                          <td className="p-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.category === "Primario"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : item.category === "Secundario"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : item.category === "Terciario"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : item.category === "Compartido"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                        : item.category === "Universal"
                                          ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                                          : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-sm">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 dark:text-slate-400">
                          No se encontraron datos que coincidan con los criterios de búsqueda
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {selectedElement && elementDetails
                  ? `Mostrando datos detallados de ${elementDetails.name}`
                  : `Mostrando ${filteredAndSortedData.length} de ${info.data.length} elementos`}
              </div>

              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar datos
              </Button>
            </div>
          </div>

          {/* Tabla de datos detallados para elementos de la intersección */}
          {isIntersection(section) && !selectedElement && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Elementos específicos de la intersección</h2>
              
              {/* Agregar un panel de resumen de la intersección */}
              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg mb-6">
                <h3 className="text-md font-medium mb-3">Intersección {section.split("").join(" ∩ ")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Total de genes: </span>
                      {loading ? (
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin ml-1"></span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats?.elements || "N/A"}</span>
                      )}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Total de rutas: </span>
                      {loading ? (
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin ml-1"></span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-semibold">{stats?.uniqueProperties || "N/A"}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Esta sección muestra los genes y rutas que son comunes a los conjuntos 
                      {section.split("").map((char, i) => {
                        return (
                          <span key={i} className="font-semibold">
                            {i > 0 && " y "}
                            {char === "A" ? "16°C" : char === "B" ? "38°C" : "41°C"}
                          </span>
                        )
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mostrar los genes comunes si hay datos disponibles */}
              {stats?.commonGenes && stats.commonGenes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Genes comunes en la intersección</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {stats.commonGenes.slice(0, 10).map((gene, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs"
                      >
                        {gene}
                      </span>
                    ))}
                    {stats.commonGenes.length > 10 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 rounded-full text-xs">
                        +{stats.commonGenes.length - 10} más
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando {Math.min(10, stats.commonGenes.length)} de {stats.commonGenes.length} genes comunes.
                  </p>
                </div>
              )}
              
              {/* Sección para mostrar las rutas metabólicas de la intersección */}
              {stats?.pathwaysList && stats.pathwaysList.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium mb-3">Rutas metabólicas en la intersección</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {stats.pathwaysList.map((pathway, index) => (
                      <div 
                        key={index} 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{pathway}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Ruta {index + 1} de {stats.pathwaysList.length}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Resumen de datos</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Distribución por categoría</h3>
                <div className="space-y-2">
                  {uniqueCategories.map((category) => {
                    const count = info.data.filter((item) => item.category === category).length
                    const percentage = Math.round((count / info.data.length) * 100)

                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{category}</span>
                          <span className="text-xs font-medium">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              category === "Primario"
                                ? "bg-green-500"
                                : category === "Secundario"
                                  ? "bg-blue-500"
                                  : category === "Terciario"
                                    ? "bg-amber-500"
                                    : category === "Compartido"
                                      ? "bg-purple-500"
                                      : category === "Universal"
                                        ? "bg-slate-500"
                                        : "bg-gray-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Estadísticas de valores</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Valor promedio:</p>
                    <p className="font-medium">
                      {Math.round(info.data.reduce((acc, item) => acc + item.value, 0) / info.data.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Valor máximo:</p>
                    <p className="font-medium">{Math.max(...info.data.map((item) => item.value))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Valor mínimo:</p>
                    <p className="font-medium">{Math.min(...info.data.map((item) => item.value))}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Datos de la base de datos</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Elementos:</p>
                    <p className="font-medium">
                      {loading ? (
                        <span className="inline-block w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></span>
                      ) : (
                        stats?.elements || info.statistics?.elements || "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Propiedades:</p>
                    <p className="font-medium">
                      {loading ? (
                        <span className="inline-block w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></span>
                      ) : (
                        stats?.uniqueProperties || info.statistics?.uniqueProperties || "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {stats && "Datos obtenidos de la base de datos"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección de información adicional para intersecciones */}
            {isIntersection(section) && stats?.pathwaysList && stats.pathwaysList.length > 0 && (
              <div className="mt-6 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Rutas metabólicas compartidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Cantidad de rutas: {stats.uniqueProperties}</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.pathwaysList.map((pathway, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full"
                        >
                          {pathway}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Cantidad de genes: {stats.elements}</p>
                    {stats.commonGenes && stats.commonGenes.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ejemplos de genes comunes:</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.commonGenes.slice(0, 5).map((gene, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full"
                            >
                              {gene}
                            </span>
                          ))}
                          {stats.commonGenes.length > 5 && (
                            <span className="px-3 py-1 text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full">
                              +{stats.commonGenes.length - 5} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
            <p>Diagrama de Venn Interactivo © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </div>
  )
}