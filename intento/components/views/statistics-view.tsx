"use client"

import type React from "react"
import { BarChart, PieChart, TrendingUp, Activity, ArrowUp, ArrowDown, Database } from "lucide-react"
// Corregir la importación de section-data
import { getSectionInfo, isIntersection } from "@/lib/section-data"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StatisticsViewProps {
  section: string
  navigationBar: React.ReactNode
}

export default function StatisticsView({ section, navigationBar }: StatisticsViewProps) {
  const info = getSectionInfo(section)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  // Obtener el elemento detallado seleccionado
  const getSelectedElementDetails = () => {
    if (!selectedElement || !info.detailedElements) return null
    return info.detailedElements.find((element: any) => element.id === selectedElement)
  }

  const elementDetails = getSelectedElementDetails()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {navigationBar}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <BarChart className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h1 className="text-3xl font-bold">Estadísticas: {info.title}</h1>
          </div>

          {/* Dropdown para seleccionar elementos específicos en intersecciones */}
          {isIntersection(section) && info.detailedElements && (
            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
              <label htmlFor="element-selector" className="block text-sm font-medium mb-2">
                Seleccionar elemento específico:
              </label>
              <Select value={selectedElement || ""} onValueChange={(value) => setSelectedElement(value)}>
                <SelectTrigger id="element-selector" className="w-full">
                  <SelectValue placeholder="Seleccionar un elemento para ver estadísticas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno (estadísticas generales)</SelectItem>
                  {info.detailedElements.map((element: any) => (
                    <SelectItem key={element.id} value={element.id}>
                      {element.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-medium mb-4">Resumen numérico</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Elementos totales</span>
                    <span className="text-sm font-medium">{info.statistics.elements}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        section.includes("A")
                          ? "bg-purple-500"
                          : section.includes("B")
                            ? "bg-blue-500"
                            : section.includes("C")
                              ? "bg-pink-500"
                              : "bg-slate-500"
                      }`}
                      style={{ width: `${(info.statistics.elements / 150) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {section.length > 1 ? "Propiedades compartidas" : "Propiedades únicas"}
                    </span>
                    <span className="text-sm font-medium">
                      {section.length > 1 ? info.statistics?.sharedProperties ?? 0 : info.statistics?.uniqueProperties ?? 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        section.includes("A")
                          ? "bg-purple-500"
                          : section.includes("B")
                            ? "bg-blue-500"
                            : section.includes("C")
                              ? "bg-pink-500"
                              : "bg-slate-500"
                      }`}
                      style={{
                        width: `${
                          section.length > 1
                            ? ((info.statistics?.sharedProperties ?? 0) / 15) * 100
                            : ((info.statistics?.uniqueProperties ?? 0) / 15) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium mb-3">Distribución por categoría</h3>
                  <div className="space-y-2">
                    {info.data.reduce((acc: any, curr) => {
                      if (!acc[curr.category]) {
                        acc[curr.category] = 0
                      }
                      acc[curr.category]++
                      return acc
                    }, {}) &&
                      // Convertir el objeto a un array para renderizar
                      Object.entries(
                        info.data.reduce((acc: any, curr) => {
                          if (!acc[curr.category]) {
                            acc[curr.category] = 0
                          }
                          acc[curr.category]++
                          return acc
                        }, {}),
                      ).map(([category, count]: [string, any], index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{category}</span>
                            <span className="text-xs font-medium">
                              {count} ({Math.round((count / info.data.length) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
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
                              style={{ width: `${(count / info.data.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-medium mb-4">Métricas clave</h2>

              {selectedElement && elementDetails ? (
                <div className="space-y-4">
                  <p className="text-slate-700 dark:text-slate-300 mb-4">{elementDetails.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    {elementDetails.detailedData
                      .filter((data: any) => data.type === "Cuantitativo")
                      .map((data: any, index: number) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{data.attribute}</span>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-2xl font-bold">{data.value}</p>
                        </div>
                      ))}
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium mb-3">Propiedades</h3>
                    <div className="flex flex-wrap gap-2">
                      {elementDetails.properties.map((property: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">
                          {property}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Valor promedio</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(info.data.reduce((acc, item) => acc + item.value, 0) / info.data.length)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Basado en {info.data.length} elementos
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Valor máximo</span>
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{Math.max(...info.data.map((item) => item.value))}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elemento de mayor valor</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Valor mínimo</span>
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold">{Math.min(...info.data.map((item) => item.value))}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elemento de menor valor</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Desviación</span>
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        Math.sqrt(
                          info.data
                            .map((item) =>
                              Math.pow(
                                item.value - info.data.reduce((acc, item) => acc + item.value, 0) / info.data.length,
                                2,
                              ),
                            )
                            .reduce((acc, val) => acc + val, 0) / info.data.length,
                        ),
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Variabilidad de los datos</p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium mb-3">Usos comunes</h3>
                <div className="flex flex-wrap gap-2">
                  {info.statistics?.commonUses?.map((use: any, index: number) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-medium mb-4">Visualización</h2>

              <div className="aspect-square bg-slate-50 dark:bg-slate-700/30 rounded-lg flex items-center justify-center mb-4">
                <div className="w-full h-full p-4 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <PieChart className="w-full h-full text-slate-300 dark:text-slate-600" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{info.statistics.elements}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">elementos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium mb-2">Distribución de valores</h3>
                <div className="flex items-end h-32 gap-1">
                  {(selectedElement && elementDetails
                    ? elementDetails.detailedData.filter((data: any) => data.type === "Cuantitativo")
                    : info.data
                  ).map((item: any, index: number) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-sm ${
                          selectedElement
                            ? "bg-indigo-500"
                            : item.category === "Primario"
                              ? "bg-green-500"
                              : item.category === "Secundario"
                                ? "bg-blue-500"
                                : item.category === "Terciario"
                                  ? "bg-amber-500"
                                  : item.category === "Compartido"
                                    ? "bg-purple-500"
                                    : item.category === "Universal"
                                      ? "bg-slate-500"
                                      : "bg-gray-500"
                        }`}
                        style={{
                          height: `${
                            selectedElement
                              ? (
                                  Number.parseFloat(item.value) /
                                    Math.max(
                                      ...elementDetails.detailedData
                                        .filter((d: any) => d.type === "Cuantitativo")
                                        .map((d: any) => Number.parseFloat(d.value)),
                                    )
                                ) * 100
                              : (item.value / Math.max(...info.data.map((i) => i.value))) * 100
                          }%`,
                        }}
                      ></div>
                      <span className="text-xs mt-1">{selectedElement ? item.attribute : item.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de datos detallados para el elemento seleccionado */}
          {selectedElement && elementDetails && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-slate-500" />
                <h2 className="text-xl font-semibold">Datos detallados: {elementDetails.name}</h2>
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

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Esta tabla muestra los atributos detallados del elemento seleccionado, incluyendo valores
                  cuantitativos, cualitativos y ordinales que definen sus características específicas.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Análisis comparativo</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700">
                    <th className="p-2 text-left text-sm font-medium">Sección</th>
                    <th className="p-2 text-left text-sm font-medium">Elementos</th>
                    <th className="p-2 text-left text-sm font-medium">Propiedades</th>
                    <th className="p-2 text-left text-sm font-medium">Valor promedio</th>
                    <th className="p-2 text-left text-sm font-medium">Relación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={`bg-white/50 dark:bg-slate-800/50 ${section === "A" ? "bg-purple-50 dark:bg-purple-900/20" : ""}`}
                  >
                    <td className="p-2 text-sm font-medium">Conjunto A</td>
                    <td className="p-2 text-sm">120</td>
                    <td className="p-2 text-sm">15</td>
                    <td className="p-2 text-sm">41</td>
                    <td className="p-2 text-sm">
                      {section === "A" ? "Seleccionado" : section.includes("A") ? "Relacionado" : "No relacionado"}
                    </td>
                  </tr>
                  <tr
                    className={`bg-slate-50/50 dark:bg-slate-700/50 ${section === "B" ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <td className="p-2 text-sm font-medium">Conjunto B</td>
                    <td className="p-2 text-sm">95</td>
                    <td className="p-2 text-sm">12</td>
                    <td className="p-2 text-sm">42</td>
                    <td className="p-2 text-sm">
                      {section === "B" ? "Seleccionado" : section.includes("B") ? "Relacionado" : "No relacionado"}
                    </td>
                  </tr>
                  <tr
                    className={`bg-white/50 dark:bg-slate-800/50 ${section === "C" ? "bg-pink-50 dark:bg-pink-900/20" : ""}`}
                  >
                    <td className="p-2 text-sm font-medium">Conjunto C</td>
                    <td className="p-2 text-sm">85</td>
                    <td className="p-2 text-sm">10</td>
                    <td className="p-2 text-sm">40</td>
                    <td className="p-2 text-sm">
                      {section === "C" ? "Seleccionado" : section.includes("C") ? "Relacionado" : "No relacionado"}
                    </td>
                  </tr>
                  <tr
                    className={`bg-slate-50/50 dark:bg-slate-700/50 ${section === "AB" ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
                  >
                    <td className="p-2 text-sm font-medium">Intersección A ∩ B</td>
                    <td className="p-2 text-sm">45</td>
                    <td className="p-2 text-sm">8</td>
                    <td className="p-2 text-sm">40</td>
                    <td className="p-2 text-sm">
                      {section === "AB"
                        ? "Seleccionado"
                        : section.includes("A") && section.includes("B")
                          ? "Relacionado"
                          : "No relacionado"}
                    </td>
                  </tr>
                  <tr
                    className={`bg-white/50 dark:bg-slate-800/50 ${section === "ABC" ? "bg-slate-200 dark:bg-slate-600/50" : ""}`}
                  >
                    <td className="p-2 text-sm font-medium">Intersección A ∩ B ∩ C</td>
                    <td className="p-2 text-sm">25</td>
                    <td className="p-2 text-sm">5</td>
                    <td className="p-2 text-sm">40</td>
                    <td className="p-2 text-sm">
                      {section === "ABC"
                        ? "Seleccionado"
                        : section.includes("A") && section.includes("B") && section.includes("C")
                          ? "Relacionado"
                          : "No relacionado"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
            <p>Diagrama de Venn Interactivo © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </div>
  )
}