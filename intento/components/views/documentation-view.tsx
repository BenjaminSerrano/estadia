"use client"

import type React from "react"
import { BookOpen, FileText, ExternalLink, Code, Database } from "lucide-react"
import { getSectionInfo, isIntersection } from "@/lib/section-data"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DocumentationViewProps {
  section: string
  navigationBar: React.ReactNode
}

export default function DocumentationView({ section, navigationBar }: DocumentationViewProps) {
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h1 className="text-3xl font-bold">Documentación: {info.title}</h1>
          </div>

          {/* Dropdown para seleccionar elementos específicos en intersecciones */}
          {isIntersection(section) && info.detailedElements && (
            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
              <label htmlFor="element-selector" className="block text-sm font-medium mb-2">
                Seleccionar elemento específico:
              </label>
              <Select value={selectedElement || ""} onValueChange={(value) => setSelectedElement(value)}>
                <SelectTrigger id="element-selector" className="w-full">
                  <SelectValue placeholder="Seleccionar un elemento para ver documentación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno (documentación general)</SelectItem>
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
            <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                {selectedElement && elementDetails ? `Documentación: ${elementDetails.name}` : "Definición formal"}
              </h2>

              <div className="prose dark:prose-invert max-w-none">
                {selectedElement && elementDetails ? (
                  <>
                    <p className="mb-4">{elementDetails.description}</p>

                    <h3 className="text-lg font-medium mt-6 mb-3">Propiedades específicas</h3>
                    <ul className="space-y-2 mb-6">
                      {elementDetails.properties.map((property: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700 dark:text-slate-300">{property}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-lg font-medium mt-6 mb-3">Características</h3>
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600 mb-6">
                      <p className="mb-2">Este elemento presenta las siguientes características:</p>
                      <ul className="space-y-2">
                        {elementDetails.detailedData
                          .filter((data: any) => data.type === "Cualitativo")
                          .map((data: any, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span className="text-slate-700 dark:text-slate-300">
                                {data.attribute}: {data.value}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-4">{info.documentation?.definition}</p>

                    <h3 className="text-lg font-medium mt-6 mb-3">Notación matemática</h3>
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600 font-mono text-center mb-6">
                      {info.documentation?.notation}
                    </div>

                    <h3 className="text-lg font-medium mt-6 mb-3">Operaciones</h3>
                    <ul className="space-y-2 mb-6">
                      {info.documentation?.operations?.map((operation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700 dark:text-slate-300">{operation}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-lg font-medium mt-6 mb-3">Propiedades matemáticas</h3>
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600 mb-6">
                      <p className="mb-2">Para cualquier conjunto A, B y C:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700 dark:text-slate-300">Conmutatividad: A ∩ B = B ∩ A</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            Asociatividad: (A ∩ B) ∩ C = A ∩ (B ∩ C)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700 dark:text-slate-300">Idempotencia: A ∩ A = A</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            Ley de De Morgan: (A ∩ B)' = A' ∪ B'
                          </span>
                        </li>
                      </ul>
                    </div>

                    {section.length > 1 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 mb-6">
                        <h4 className="font-medium mb-2">Nota sobre intersecciones</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                          La intersección de conjuntos representa los elementos que pertenecen simultáneamente a todos
                          los conjuntos involucrados. A medida que se aumenta el número de conjuntos en la intersección,
                          el conjunto resultante tiende a ser más pequeño y específico.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              {selectedElement && elementDetails ? (
                <>
                  <h2 className="text-lg font-medium mb-4">Información técnica</h2>

                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <h3 className="font-medium mb-1">Identificador</h3>
                      <p className="text-sm font-mono">{elementDetails.id}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <h3 className="font-medium mb-1">Valores cuantitativos</h3>
                      <ul className="space-y-2">
                        {elementDetails.detailedData
                          .filter((data: any) => data.type === "Cuantitativo")
                          .map((data: any, index: number) => (
                            <li key={index} className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{data.attribute}:</span>
                              <span className="text-sm font-medium">{data.value}</span>
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium mb-3">Pertenencia</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Este elemento pertenece a la intersección {section.split("").join(" ∩ ")}, lo que significa que
                        cumple con las propiedades de{" "}
                        {section
                          .split("")
                          .map((s) => `conjunto ${s}`)
                          .join(" y ")}
                        .
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-medium mb-4">Referencias bibliográficas</h2>

                  <div className="space-y-4">
                    {info.references?.map((ref: any, index: number) => (
                      <div
                        key={index}
                        className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        <h3 className="font-medium mb-1">{ref.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {ref.author}, {ref.year}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400">Ver referencia</span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium mb-3">Recursos adicionales</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                          <span className="text-slate-700 dark:text-slate-300">
                            Guía completa de Teoría de Conjuntos
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                          <span className="text-slate-700 dark:text-slate-300">
                            Aplicaciones prácticas de los Diagramas de Venn
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                          <span className="text-slate-700 dark:text-slate-300">
                            Operaciones avanzadas con conjuntos
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {selectedElement && elementDetails
                ? `Implementación de ${elementDetails.name}`
                : "Implementación en código"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">JavaScript</h3>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>
                    {selectedElement && elementDetails
                      ? `// Definición del elemento ${elementDetails.name}
const ${elementDetails.id.toLowerCase().replace(/-/g, "_")} = {
  id: "${elementDetails.id}",
  name: "${elementDetails.name}",
  properties: [
${elementDetails.properties.map((prop: string) => `    "${prop}"`).join(",\n")}
  ],
  values: {
${elementDetails.detailedData.map((data: any) => `    ${data.attribute.toLowerCase().replace(/\s+/g, "_")}: ${data.value}`).join(",\n")}
  }
};

// Verificar pertenencia a la intersección ${section}
function belongsToIntersection(element) {
  return ${section
    .split("")
    .map((s) => `sets.${s.toLowerCase()}.has(element.id)`)
    .join(" && ")};
}

console.log(belongsToIntersection(${elementDetails.id.toLowerCase().replace(/-/g, "_")})); // true`
                      : `// Definición de conjuntos
const setA = new Set([1, 2, 3, 4, 5]);
const setB = new Set([4, 5, 6, 7, 8]);
const setC = new Set([7, 8, 9, 10]);

// Función para calcular intersección
function intersection(...sets) {
  if (sets.length === 0) return new Set();
  
  const result = new Set(sets[0]);
  
  for (const set of sets.slice(1)) {
    for (const elem of result) {
      if (!set.has(elem)) {
        result.delete(elem);
      }
    }
  }
  
  return result;
}

// Calcular ${section.split("").join(" ∩ ")}
const result = intersection(${section
                          .split("")
                          .map((s) => `set${s}`)
                          .join(", ")});
console.log(result); // Resultado de la intersección`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Python</h3>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>
                    {selectedElement && elementDetails
                      ? `# Definición del elemento ${elementDetails.name}
${elementDetails.id.lower().replace("-", "_")} = {
    "id": "${elementDetails.id}",
    "name": "${elementDetails.name}",
    "properties": [
${elementDetails.properties.map((prop: string) => `        "${prop}"`).join(",\n")}
    ],
    "values": {
${elementDetails.detailedData.map((data: any) => `        "${data.attribute.toLowerCase().replace(/\s+/g, "_")}": ${data.value}`).join(",\n")}
    }
}

# Verificar pertenencia a la intersección ${section}
def belongs_to_intersection(element):
    return ${section
      .split("")
      .map((s) => `element["id"] in sets_${s.toLowerCase()}`)
      .join(" and ")}

print(belongs_to_intersection(${elementDetails.id.lower().replace("-", "_")}))  # True`
                      : `# Definición de conjuntos
set_a = {1, 2, 3, 4, 5}
set_b = {4, 5, 6, 7, 8}
set_c = {7, 8, 9, 10}

# Calcular ${section.split("").join(" ∩ ")}
result = ${section
                          .split("")
                          .map((s) => `set_${s.toLowerCase()}`)
                          .join(" & ")}

print(result)  # Resultado de la intersección`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-medium">Ejemplo de uso</h3>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                  {selectedElement && elementDetails
                    ? `Este código muestra cómo definir y trabajar con el elemento ${elementDetails.name} dentro de la intersección ${section.split("").join(" ∩ ")}.`
                    : `Este código muestra cómo implementar y calcular la ${section.length > 1 ? "intersección" : "definición"} de ${section.length > 1 ? "los conjuntos" : "un conjunto"} ${section.split("").join(", ")} utilizando JavaScript y Python.`}
                </p>

                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {selectedElement && elementDetails
                    ? `Los elementos de una intersección heredan propiedades de todos los conjuntos a los que pertenecen, lo que los hace especialmente útiles para análisis de datos y clasificación.`
                    : `La intersección de conjuntos es una operación fundamental en la teoría de conjuntos y tiene aplicaciones en bases de datos, análisis de datos, lógica y muchos otros campos.`}
                </p>
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

          <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
            <p>Diagrama de Venn Interactivo © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </div>
  )
}