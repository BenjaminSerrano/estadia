"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  Circle,
  Download,
  ExternalLink,
  Info,
  Lightbulb,
  List,
  Share2,
  BarChart,
  BookOpen,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InfoPanelProps {
  selectedSection: string | null
}

export default function InfoPanel({ selectedSection }: InfoPanelProps) {
  const { toast } = useToast()
  const [selectedView, setSelectedView] = useState<string>("informacion")

  // Define information for each section with improved content
  const sectionInfo = {
    A: {
      title: "Conjunto A",
      description:
        "Este conjunto representa todos los elementos que pertenecen exclusivamente al conjunto A, sin intersecciones con otros conjuntos.",
      examples: ["Elementos únicos del conjunto A", "Elementos que tienen la propiedad A pero no B ni C"],
      properties: ["Propiedad exclusiva de A", "No comparte elementos con B ni C"],
      applications: ["Clasificación de elementos únicos", "Identificación de características exclusivas"],
      color: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
      borderColor: "border-purple-200 dark:border-purple-700",
      icon: <Circle className="w-6 h-6 text-purple-500" />,
      accentColor: "text-purple-600 dark:text-purple-400",
      statistics: {
        elements: 120,
        uniqueProperties: 15,
        commonUses: ["Categorización", "Filtrado", "Análisis de exclusividad"],
      },
      documentation: {
        definition:
          "En teoría de conjuntos, un conjunto es una colección de objetos considerados como un todo. El conjunto A representa una colección específica de elementos que comparten ciertas propiedades.",
        notation: "A = {x | x tiene la propiedad P}",
        operations: ["Unión (A ∪ B)", "Intersección (A ∩ B)", "Complemento (A')"],
      },
      data: [
        { id: 1, name: "Elemento A1", value: 45, category: "Primario" },
        { id: 2, name: "Elemento A2", value: 32, category: "Secundario" },
        { id: 3, name: "Elemento A3", value: 67, category: "Primario" },
        { id: 4, name: "Elemento A4", value: 21, category: "Terciario" },
      ],
      references: [
        { title: "Teoría de Conjuntos Básica", author: "J. Martínez", year: 2018 },
        { title: "Aplicaciones de Conjuntos en Ciencias de Datos", author: "A. López", year: 2020 },
      ],
    },
    B: {
      title: "Conjunto B",
      description:
        "Este conjunto representa todos los elementos que pertenecen exclusivamente al conjunto B, sin intersecciones con otros conjuntos.",
      examples: ["Elementos únicos del conjunto B", "Elementos que tienen la propiedad B pero no A ni C"],
      properties: ["Propiedad exclusiva de B", "No comparte elementos con A ni C"],
      applications: ["Clasificación de elementos únicos", "Identificación de características exclusivas"],
      color: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
      borderColor: "border-blue-200 dark:border-blue-700",
      icon: <Circle className="w-6 h-6 text-blue-500" />,
      accentColor: "text-blue-600 dark:text-blue-400",
      statistics: {
        elements: 95,
        uniqueProperties: 12,
        commonUses: ["Agrupación", "Comparación", "Análisis de exclusividad"],
      },
      documentation: {
        definition:
          "El conjunto B representa una colección específica de elementos que comparten ciertas propiedades distintas a las del conjunto A y C.",
        notation: "B = {x | x tiene la propiedad Q}",
        operations: ["Unión (B ∪ A)", "Intersección (B ∩ A)", "Complemento (B')"],
      },
      data: [
        { id: 1, name: "Elemento B1", value: 38, category: "Primario" },
        { id: 2, name: "Elemento B2", value: 54, category: "Secundario" },
        { id: 3, name: "Elemento B3", value: 29, category: "Primario" },
        { id: 4, name: "Elemento B4", value: 47, category: "Secundario" },
      ],
      references: [
        { title: "Conjuntos y Operaciones", author: "M. García", year: 2019 },
        { title: "Análisis de Datos con Teoría de Conjuntos", author: "P. Rodríguez", year: 2021 },
      ],
    },
    C: {
      title: "Conjunto C",
      description:
        "Este conjunto representa todos los elementos que pertenecen exclusivamente al conjunto C, sin intersecciones con otros conjuntos.",
      examples: ["Elementos únicos del conjunto C", "Elementos que tienen la propiedad C pero no A ni B"],
      properties: ["Propiedad exclusiva de C", "No comparte elementos con A ni B"],
      applications: ["Clasificación de elementos únicos", "Identificación de características exclusivas"],
      color: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30",
      borderColor: "border-pink-200 dark:border-pink-700",
      icon: <Circle className="w-6 h-6 text-pink-500" />,
      accentColor: "text-pink-600 dark:text-pink-400",
      statistics: {
        elements: 85,
        uniqueProperties: 10,
        commonUses: ["Segmentación", "Análisis de exclusividad", "Clasificación"],
      },
      documentation: {
        definition:
          "El conjunto C representa una colección específica de elementos que comparten ciertas propiedades distintas a las de los conjuntos A y B.",
        notation: "C = {x | x tiene la propiedad R}",
        operations: ["Unión (C ∪ A)", "Intersección (C ∩ B)", "Complemento (C')"],
      },
      data: [
        { id: 1, name: "Elemento C1", value: 42, category: "Primario" },
        { id: 2, name: "Elemento C2", value: 19, category: "Terciario" },
        { id: 3, name: "Elemento C3", value: 63, category: "Secundario" },
        { id: 4, name: "Elemento C4", value: 35, category: "Primario" },
      ],
      references: [
        { title: "Fundamentos de Teoría de Conjuntos", author: "L. Sánchez", year: 2017 },
        { title: "Conjuntos en Ciencia de Datos", author: "R. Fernández", year: 2022 },
      ],
    },
    AB: {
      title: "Intersección A ∩ B",
      description:
        "Esta intersección representa los elementos que pertenecen tanto al conjunto A como al conjunto B, pero no al conjunto C.",
      examples: [
        "Elementos compartidos entre A y B",
        "Elementos que tienen propiedades tanto de A como de B pero no de C",
      ],
      properties: ["Comparte propiedades de A y B", "No tiene propiedades de C"],
      applications: ["Análisis de características compartidas", "Identificación de patrones comunes entre dos grupos"],
      color: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30",
      borderColor: "border-indigo-200 dark:border-indigo-700",
      icon: <CheckCircle className="w-6 h-6 text-indigo-500" />,
      accentColor: "text-indigo-600 dark:text-indigo-400",
      statistics: {
        elements: 45,
        sharedProperties: 8,
        commonUses: ["Análisis de similitudes", "Identificación de patrones comunes"],
      },
      documentation: {
        definition:
          "La intersección A ∩ B es el conjunto de todos los elementos que pertenecen tanto al conjunto A como al conjunto B.",
        notation: "A ∩ B = {x | x ∈ A y x ∈ B}",
        operations: ["Unión con C ((A ∩ B) ∪ C)", "Complemento ((A ∩ B)')"],
      },
      data: [
        { id: 1, name: "Elemento AB1", value: 51, category: "Compartido" },
        { id: 2, name: "Elemento AB2", value: 37, category: "Compartido" },
        { id: 3, name: "Elemento AB3", value: 44, category: "Compartido" },
        { id: 4, name: "Elemento AB4", value: 29, category: "Compartido" },
      ],
      references: [
        { title: "Intersecciones de Conjuntos", author: "J. Pérez", year: 2019 },
        { title: "Análisis de Datos con Intersecciones", author: "M. Torres", year: 2021 },
      ],
    },
    AC: {
      title: "Intersección A ∩ C",
      description:
        "Esta intersección representa los elementos que pertenecen tanto al conjunto A como al conjunto C, pero no al conjunto B.",
      examples: [
        "Elementos compartidos entre A y C",
        "Elementos que tienen propiedades tanto de A como de C pero no de B",
      ],
      properties: ["Comparte propiedades de A y C", "No tiene propiedades de B"],
      applications: ["Análisis de características compartidas", "Identificación de patrones comunes entre dos grupos"],
      color: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/30 dark:to-fuchsia-800/30",
      borderColor: "border-fuchsia-200 dark:border-fuchsia-700",
      icon: <CheckCircle className="w-6 h-6 text-fuchsia-500" />,
      accentColor: "text-fuchsia-600 dark:text-fuchsia-400",
      statistics: {
        elements: 38,
        sharedProperties: 7,
        commonUses: ["Análisis de similitudes", "Identificación de patrones comunes"],
      },
      documentation: {
        definition:
          "La intersección A ∩ C es el conjunto de todos los elementos que pertenecen tanto al conjunto A como al conjunto C.",
        notation: "A ∩ C = {x | x ∈ A y x ∈ C}",
        operations: ["Unión con B ((A ∩ C) ∪ B)", "Complemento ((A ∩ C)')"],
      },
      data: [
        { id: 1, name: "Elemento AC1", value: 48, category: "Compartido" },
        { id: 2, name: "Elemento AC2", value: 33, category: "Compartido" },
        { id: 3, name: "Elemento AC3", value: 52, category: "Compartido" },
        { id: 4, name: "Elemento AC4", value: 27, category: "Compartido" },
      ],
      references: [
        { title: "Intersecciones en Análisis de Datos", author: "A. Gómez", year: 2020 },
        { title: "Aplicaciones de Intersecciones de Conjuntos", author: "C. Ruiz", year: 2022 },
      ],
    },
    BC: {
      title: "Intersección B ∩ C",
      description:
        "Esta intersección representa los elementos que pertenecen tanto al conjunto B como al conjunto C, pero no al conjunto A.",
      examples: [
        "Elementos compartidos entre B y C",
        "Elementos que tienen propiedades tanto de B como de C pero no de A",
      ],
      properties: ["Comparte propiedades de B y C", "No tiene propiedades de A"],
      applications: ["Análisis de características compartidas", "Identificación de patrones comunes entre dos grupos"],
      color: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30",
      borderColor: "border-violet-200 dark:border-violet-700",
      icon: <CheckCircle className="w-6 h-6 text-violet-500" />,
      accentColor: "text-violet-600 dark:text-violet-400",
      statistics: {
        elements: 42,
        sharedProperties: 6,
        commonUses: ["Análisis de similitudes", "Identificación de patrones comunes"],
      },
      documentation: {
        definition:
          "La intersección B ∩ C es el conjunto de todos los elementos que pertenecen tanto al conjunto B como al conjunto C.",
        notation: "B ∩ C = {x | x ∈ B y x ∈ C}",
        operations: ["Unión con A ((B ∩ C) ∪ A)", "Complemento ((B ∩ C)')"],
      },
      data: [
        { id: 1, name: "Elemento BC1", value: 39, category: "Compartido" },
        { id: 2, name: "Elemento BC2", value: 46, category: "Compartido" },
        { id: 3, name: "Elemento BC3", value: 31, category: "Compartido" },
        { id: 4, name: "Elemento BC4", value: 55, category: "Compartido" },
      ],
      references: [
        { title: "Intersecciones en Ciencia de Datos", author: "E. Díaz", year: 2019 },
        { title: "Análisis de Intersecciones de Conjuntos", author: "F. Moreno", year: 2021 },
      ],
    },
    ABC: {
      title: "Intersección A ∩ B ∩ C",
      description:
        "Esta intersección central representa los elementos que pertenecen simultáneamente a los tres conjuntos: A, B y C.",
      examples: [
        "Elementos compartidos entre los tres conjuntos",
        "Elementos que tienen propiedades de A, B y C simultáneamente",
      ],
      properties: ["Comparte propiedades de A, B y C", "Representa la máxima superposición de los tres conjuntos"],
      applications: [
        "Identificación de elementos con múltiples características",
        "Análisis de casos que cumplen todos los criterios",
      ],
      color: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
      borderColor: "border-slate-200 dark:border-slate-600",
      icon: <CheckCircle className="w-6 h-6 text-slate-500" />,
      accentColor: "text-slate-700 dark:text-slate-300",
      statistics: {
        elements: 25,
        sharedProperties: 5,
        commonUses: ["Análisis de elementos comunes", "Identificación de patrones universales"],
      },
      documentation: {
        definition:
          "La intersección A ∩ B ∩ C es el conjunto de todos los elementos que pertenecen simultáneamente a los conjuntos A, B y C.",
        notation: "A ∩ B ∩ C = {x | x ∈ A y x ∈ B y x ∈ C}",
        operations: ["Complemento ((A ∩ B ∩ C)')", "Subconjunto de cualquier intersección de dos conjuntos"],
      },
      data: [
        { id: 1, name: "Elemento ABC1", value: 43, category: "Universal" },
        { id: 2, name: "Elemento ABC2", value: 36, category: "Universal" },
        { id: 3, name: "Elemento ABC3", value: 49, category: "Universal" },
        { id: 4, name: "Elemento ABC4", value: 32, category: "Universal" },
      ],
      references: [
        { title: "Intersecciones Múltiples en Teoría de Conjuntos", author: "G. Hernández", year: 2018 },
        { title: "Aplicaciones de Intersecciones Triples", author: "H. Navarro", year: 2022 },
      ],
    },
  }

  const handleShare = () => {
    if (navigator.share && selectedSection) {
      navigator
        .share({
          title: `Información sobre ${sectionInfo[selectedSection as keyof typeof sectionInfo].title}`,
          text: sectionInfo[selectedSection as keyof typeof sectionInfo].description,
          url: window.location.href,
        })
        .catch(() => {
          copyToClipboard()
        })
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    if (selectedSection) {
      const info = sectionInfo[selectedSection as keyof typeof sectionInfo]
      const text = `${info.title}: ${info.description}`
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The information has been copied",
          duration: 3000,
        })
      })
    }
  }

  if (!selectedSection) {
    return (
      <div className="h-full flex items-center justify-center p-8 border rounded-2xl bg-white/50 dark:bg-slate-800/50 shadow-lg backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-8 h-8 text-slate-400 dark:text-slate-300" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs">
            Select a section of the Venn diagram to view detailed information
          </p>
        </div>
      </div>
    )
  }

  const info = sectionInfo[selectedSection as keyof typeof sectionInfo]

  // Renderizar la vista correspondiente según la opción seleccionada
  const renderView = () => {
    switch (selectedView) {
      case "informacion":
        return (
          <div className="space-y-4">
            <Tabs defaultValue="descripcion" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="descripcion">Description</TabsTrigger>
                <TabsTrigger value="propiedades">Properties</TabsTrigger>
                <TabsTrigger value="aplicaciones">Applications</TabsTrigger>
              </TabsList>

              <TabsContent value="descripcion" className="space-y-4">
                <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold">Description:</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{info.description}</p>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <List className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold">Examples:</h3>
                  </div>
                  <ul className="space-y-2">
                    {info.examples.map((example, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="propiedades" className="space-y-4">
                <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold">Properties:</h3>
                  </div>
                  <ul className="space-y-2">
                    {info.properties.map((property, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{property}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedSection === "ABC" && (
                  <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-amber-600 dark:text-amber-400">Interesting fact:</h3>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      This is the central intersection where all three sets overlap, representing elements
                      that simultaneously satisfy all three conditions.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="aplicaciones" className="space-y-4">
                <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold">Applications:</h3>
                  </div>
                  <ul className="space-y-2">
                    {info.applications.map((application, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{application}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )

      case "estadisticas":
        return (
          <div className="space-y-4">
            <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold">Statistics:</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Number of elements</h4>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        selectedSection.includes("A")
                          ? "bg-purple-500"
                          : selectedSection.includes("B")
                            ? "bg-blue-500"
                            : selectedSection.includes("C")
                              ? "bg-pink-500"
                              : "bg-slate-500"
                      }`}
                      style={{ width: `${(info.statistics.elements / 150) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm mt-1">{info.statistics.elements} elements</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">
                      {selectedSection.length > 1 ? "Shared properties" : "Unique properties"}
                    </h4>
                    <p className="text-2xl font-bold">
                      {selectedSection.length > 1 ? info.statistics.sharedProperties : info.statistics.uniqueProperties}
                    </p>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Distribution</h4>
                    <div className="flex items-end h-12 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-t-sm ${
                            selectedSection.includes("A")
                              ? "bg-purple-500"
                              : selectedSection.includes("B")
                                ? "bg-blue-500"
                                : selectedSection.includes("C")
                                  ? "bg-pink-500"
                                  : "bg-slate-500"
                          }`}
                          style={{
                            height: `${Math.random() * 100}%`,
                            opacity: 0.5 + i * 0.1,
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Common uses</h4>
                  <ul className="space-y-1">
                    {info.statistics.commonUses.map((use, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-slate-400 mt-1">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case "documentacion":
        return (
          <div className="space-y-4">
            <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold">Documentation:</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Definition</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">{info.documentation.definition}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Notation</h4>
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg font-mono text-center">
                    {info.documentation.notation}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Operations</h4>
                  <ul className="space-y-1">
                    {info.documentation.operations.map((operation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-slate-400 mt-1">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{operation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">References</h4>
                  <ul className="space-y-2">
                    {info.references.map((ref, index) => (
                      <li
                        key={index}
                        className="bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600 text-sm"
                      >
                        <p className="font-medium">{ref.title}</p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {ref.author}, {ref.year}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case "datos":
        return (
          <div className="space-y-4">
            <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold">Data:</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700">
                      <th className="p-2 text-left text-sm font-medium">ID</th>
                      <th className="p-2 text-left text-sm font-medium">Name</th>
                      <th className="p-2 text-left text-sm font-medium">Value</th>
                      <th className="p-2 text-left text-sm font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.data.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-white/50 dark:bg-slate-800/50" : "bg-slate-50/50 dark:bg-slate-700/50"
                        }
                      >
                        <td className="p-2 text-sm">{item.id}</td>
                        <td className="p-2 text-sm">{item.name}</td>
                        <td className="p-2 text-sm">{item.value}</td>
                        <td className="p-2 text-sm">
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
                                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-medium mb-2">Data summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Average value:</p>
                    <p className="font-medium">
                      {Math.round(info.data.reduce((acc, item) => acc + item.value, 0) / info.data.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Maximum value:</p>
                    <p className="font-medium">{Math.max(...info.data.map((item) => item.value))}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 text-center">
            <p>View not available</p>
          </div>
        )
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${selectedSection}-${selectedView}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`p-6 border-2 rounded-2xl shadow-lg ${info.color} ${info.borderColor} h-full`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {info.icon}
            <h2 className={`text-2xl font-bold ${info.accentColor}`}>{info.title}</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={handleShare}
              aria-label="Share information"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => {
                toast({
                  title: "Download started",
                  description: "The information is being downloaded",
                  duration: 3000,
                })
              }}
              aria-label="Download information"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="view-selector" className="block text-sm font-medium mb-2">
            Select view:
          </label>
          <Select value={selectedView} onValueChange={(value) => setSelectedView(value)}>
            <SelectTrigger id="view-selector" className="w-full">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="informacion">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>General information</span>
                </div>
              </SelectItem>
              <SelectItem value="estadisticas">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Statistics</span>
                </div>
              </SelectItem>
              <SelectItem value="documentacion">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Documentation</span>
                </div>
              </SelectItem>
              <SelectItem value="datos">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Data</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderView()}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            You can select another section of the diagram to compare information
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

