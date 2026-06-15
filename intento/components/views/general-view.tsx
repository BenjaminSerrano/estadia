"use client"

import type React from "react"
import { CheckCircle, Info, List, ExternalLink, Lightbulb, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSectionInfo, isIntersection } from "@/lib/section-data"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GeneralViewProps {
  section: string
  navigationBar: React.ReactNode
}

export default function GeneralView({ section, navigationBar }: GeneralViewProps) {
  const info = getSectionInfo(section)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  // Obtener el elemento detallado seleccionado
  const getSelectedElementDetails = () => {
    if (!selectedElement || !info.detailedElements) return null
    return info.detailedElements.find((element: any) => element.id === selectedElement)
  }

  const elementDetails = getSelectedElementDetails()

  return (
    <div className="min-h-screen bg-background dot-grid">
      {navigationBar}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Modificar cómo se renderiza el icono */}
          <div className="flex items-center gap-3 mb-6">
            {typeof info.icon === "function" ? info.icon() : null}
            <h1 className={`text-3xl font-bold font-[family-name:var(--font-display)] ${info.accentColor}`}>{info.title}</h1>
          </div>

          {/* Dropdown para seleccionar elementos específicos en intersecciones */}
          {isIntersection(section) && info.detailedElements && (
            <div className="mb-6 bg-card border border-border p-4 rounded-xl shadow-md">
              <label htmlFor="element-selector" className="block text-sm font-medium mb-2">
                Seleccionar elemento específico:
              </label>
              <Select value={selectedElement || ""} onValueChange={(value) => setSelectedElement(value)}>
                <SelectTrigger id="element-selector" className="w-full">
                  <SelectValue placeholder="Seleccionar un elemento para ver detalles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno (vista general)</SelectItem>
                  {info.detailedElements.map((element: any) => (
                    <SelectItem key={element.id} value={element.id}>
                      {element.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className={`col-span-3 md:col-span-1 p-6 rounded-xl ${info.color} border ${info.borderColor}`}>
              <div className="aspect-square rounded-lg bg-white/50 dark:bg-slate-800/50 flex items-center justify-center mb-4 overflow-hidden relative">
                <div
                  className={`absolute inset-0 opacity-10 ${
                    section.includes("A")
                      ? "bg-purple-500"
                      : section.includes("B")
                        ? "bg-blue-500"
                        : section.includes("C")
                          ? "bg-pink-500"
                          : "bg-slate-500"
                  }`}
                ></div>
                <div className="text-8xl font-bold text-center opacity-20">{section}</div>
              </div>

              <h2 className="text-lg font-semibold mb-2">Resumen</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                {selectedElement && elementDetails ? elementDetails.description : info.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Elementos:</p>
                  <p className="font-medium text-lg">{info.statistics?.elements ?? 0}</p>
                </div>
                <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Propiedades:</p>
                  <p className="font-medium text-lg">
                    {section.length > 1 ? info.statistics?.sharedProperties ?? 0 : info.statistics?.uniqueProperties ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-3 md:col-span-2">
              {selectedElement && elementDetails ? (
                <div className="bg-card border border-border p-6 rounded-xl shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold">Propiedades del elemento {elementDetails.name}:</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <ul className="space-y-2">
                        {elementDetails.properties.map((property: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-slate-400 mt-1">•</span>
                            <span className="text-slate-700 dark:text-slate-300">{property}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="descripcion" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="descripcion">Descripción</TabsTrigger>
                    <TabsTrigger value="propiedades">Propiedades</TabsTrigger>
                    <TabsTrigger value="aplicaciones">Aplicaciones</TabsTrigger>
                  </TabsList>

                  <TabsContent value="descripcion" className="space-y-4">
                    <div className="bg-card border border-border p-6 rounded-xl shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-slate-500" />
                        <h3 className="font-semibold">Descripción detallada:</h3>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                        {info.description}
                        {section.length > 1 && (
                          <span>
                            {" "}
                            Esta intersección representa un subconjunto específico que cumple con múltiples condiciones
                            simultáneamente, lo que permite un análisis más detallado de las relaciones entre los
                            conjuntos principales.
                          </span>
                        )}
                      </p>

                      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                          <List className="w-5 h-5 text-slate-500" />
                          <h3 className="font-semibold">Ejemplos:</h3>
                        </div>
                        <ul className="space-y-2">
                          {info.examples?.map((example, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span className="text-slate-700 dark:text-slate-300">{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="propiedades" className="space-y-4">
                    <div className="bg-card border border-border p-6 rounded-xl shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-slate-500" />
                        <h3 className="font-semibold">Propiedades:</h3>
                      </div>

                      <div className="grid gap-4 mb-6">
                        {info.properties?.map((property, index) => (
                          <div
                            key={index}
                            className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600"
                          >
                            <p className="text-slate-700 dark:text-slate-300">{property}</p>
                          </div>
                        ))}
                      </div>

                      {section === "ABC" && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold text-amber-600 dark:text-amber-400">Dato interesante:</h3>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">
                            Esta es la intersección central donde los tres conjuntos se superponen, representando
                            elementos que satisfacen simultáneamente las tres condiciones. Es el conjunto más
                            restrictivo y específico del diagrama.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="aplicaciones" className="space-y-4">
                    <div className="bg-card border border-border p-6 rounded-xl shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <ExternalLink className="w-5 h-5 text-slate-500" />
                        <h3 className="font-semibold">Aplicaciones:</h3>
                      </div>

                      <div className="grid gap-4">
                        {info.applications?.map((application, index) => (
                          <div
                            key={index}
                            className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600"
                          >
                            <p className="text-slate-700 dark:text-slate-300">{application}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h4 className="font-medium mb-2">Usos comunes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {info.statistics?.commonUses?.map((use, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-sm border border-slate-200 dark:border-slate-600"
                            >
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Relaciones con otros conjuntos</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section !== "A" && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800/30">
                  <h3 className="font-medium mb-2 text-purple-700 dark:text-purple-300">Conjunto A</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {section.includes("A")
                      ? "Este conjunto es parte de la intersección seleccionada."
                      : "Este conjunto no tiene relación directa con la selección actual."}
                  </p>
                </div>
              )}

              {section !== "B" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
                  <h3 className="font-medium mb-2 text-blue-700 dark:text-blue-300">Conjunto B</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {section.includes("B")
                      ? "Este conjunto es parte de la intersección seleccionada."
                      : "Este conjunto no tiene relación directa con la selección actual."}
                  </p>
                </div>
              )}

              {section !== "C" && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800/30">
                  <h3 className="font-medium mb-2 text-pink-700 dark:text-pink-300">Conjunto C</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {section.includes("C")
                      ? "Este conjunto es parte de la intersección seleccionada."
                      : "Este conjunto no tiene relación directa con la selección actual."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de datos detallados para el elemento seleccionado */}
          {selectedElement && elementDetails && (
            <div className="bg-card border border-border p-6 rounded-xl shadow-md mb-8">
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

          <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
            <p>Diagrama de Venn Interactivo © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </div>
  )
}

