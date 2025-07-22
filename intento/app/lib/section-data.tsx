import { Circle, CheckCircle } from "lucide-react"

// Función para obtener la información de una sección específica
export function getSectionInfo(section: string) {
  const sectionInfo: any = {
    A: {
      title: "Conjunto A",
      description:
        "Este conjunto representa todos los elementos que pertenecen exclusivamente al conjunto A, sin intersecciones con otros conjuntos.",
      examples: ["Elementos únicos del conjunto A", "Elementos que tienen la propiedad A pero no B ni C"],
      properties: ["Propiedad exclusiva de A", "No comparte elementos con B ni C"],
      applications: ["Clasificación de elementos únicos", "Identificación de características exclusivas"],
      color: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
      borderColor: "border-purple-200 dark:border-purple-700",
      icon: () => <Circle className="w-6 h-6 text-purple-500" />,
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
      icon: () => <Circle className="w-6 h-6 text-blue-500" />,
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
      icon: () => <Circle className="w-6 h-6 text-pink-500" />,
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
      icon: () => <CheckCircle className="w-6 h-6 text-indigo-500" />,
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
      // Elementos detallados para la intersección AB
      detailedElements: [
        {
          id: "AB-E1",
          name: "Elemento AB-E1",
          description: "Elemento que comparte propiedades específicas de los conjuntos A y B",
          properties: ["Propiedad A1", "Propiedad B2", "Característica compartida AB1"],
          detailedData: [
            { attribute: "Valor numérico", value: "78.5", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo II", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Alta", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto A", type: "Nominal" },
            { attribute: "Destino", value: "Conjunto B", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.85", type: "Cuantitativo" },
          ],
        },
        {
          id: "AB-E2",
          name: "Elemento AB-E2",
          description: "Elemento híbrido con características dominantes del conjunto B",
          properties: ["Propiedad A3", "Propiedad B1", "Característica compartida AB2"],
          detailedData: [
            { attribute: "Valor numérico", value: "42.3", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo I", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Media", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto B", type: "Nominal" },
            { attribute: "Destino", value: "Conjunto A", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.67", type: "Cuantitativo" },
          ],
        },
        {
          id: "AB-E3",
          name: "Elemento AB-E3",
          description: "Elemento con distribución equilibrada de propiedades A y B",
          properties: ["Propiedad A2", "Propiedad B3", "Característica compartida AB3"],
          detailedData: [
            { attribute: "Valor numérico", value: "65.1", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo III", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Baja", type: "Ordinal" },
            { attribute: "Origen", value: "Mixto", type: "Nominal" },
            { attribute: "Destino", value: "Mixto", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.92", type: "Cuantitativo" },
          ],
        },
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
      icon: () => <CheckCircle className="w-6 h-6 text-fuchsia-500" />,
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
      // Elementos detallados para la intersección AC
      detailedElements: [
        {
          id: "AC-E1",
          name: "Elemento AC-E1",
          description: "Elemento que combina características principales de A y C",
          properties: ["Propiedad A1", "Propiedad C3", "Característica compartida AC1"],
          detailedData: [
            { attribute: "Valor numérico", value: "56.7", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo II", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Alta", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto A", type: "Nominal" },
            { attribute: "Destino", value: "Conjunto C", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.78", type: "Cuantitativo" },
          ],
        },
        {
          id: "AC-E2",
          name: "Elemento AC-E2",
          description: "Elemento con predominancia de propiedades del conjunto C",
          properties: ["Propiedad A2", "Propiedad C1", "Característica compartida AC2"],
          detailedData: [
            { attribute: "Valor numérico", value: "39.2", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo I", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Media", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto C", type: "Nominal" },
            { attribute: "Destino", value: "Conjunto A", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.61", type: "Cuantitativo" },
          ],
        },
        {
          id: "AC-E3",
          name: "Elemento AC-E3",
          description: "Elemento híbrido con distribución equilibrada de propiedades",
          properties: ["Propiedad A4", "Propiedad C2", "Característica compartida AC3"],
          detailedData: [
            { attribute: "Valor numérico", value: "72.8", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo III", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Baja", type: "Ordinal" },
            { attribute: "Origen", value: "Mixto", type: "Nominal" },
            { attribute: "Destino", value: "Mixto", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.89", type: "Cuantitativo" },
          ],
        },
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
      icon: () => <CheckCircle className="w-6 h-6 text-violet-500" />,
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
      // Elementos detallados para la intersección BC
      detailedElements: [
        {
          id: "BC-E1",
          name: "Elemento BC-E1",
          description: "Elemento que integra propiedades clave de B y C",
          properties: ["Propiedad B2", "Propiedad C1", "Característica compartida BC1"],
          detailedData: [
            { attribute: "Valor numérico", value: "63.4", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo II", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Alta", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto B", type: "Nominal" },
            { attribute: "Destino", value: "Conjunto C", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.82", type: "Cuantitativo" },
          ],
        },
        {
          id: "BC-E2",
          name: "Elemento BC-E2",
          description: "Elemento con mayor influencia del conjunto B",
          properties: ["Propiedad B1", "Propiedad C3", "Característica compartida BC2"],
          detailedData: [
            { attribute: "Valor numérico", value: "47.9", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo I", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Media", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto B", type: "Nominal" },
            { attribute: "Destino", value: "Conjunto C", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.73", type: "Cuantitativo" },
          ],
        },
        {
          id: "BC-E3",
          name: "Elemento BC-E3",
          description: "Elemento con propiedades balanceadas de ambos conjuntos",
          properties: ["Propiedad B3", "Propiedad C2", "Característica compartida BC3"],
          detailedData: [
            { attribute: "Valor numérico", value: "58.6", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo III", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Baja", type: "Ordinal" },
            { attribute: "Origen", value: "Mixto", type: "Nominal" },
            { attribute: "Destino", value: "Mixto", type: "Nominal" },
            { attribute: "Peso relativo", value: "0.91", type: "Cuantitativo" },
          ],
        },
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
      icon: () => <CheckCircle className="w-6 h-6 text-slate-500" />,
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
      // Elementos detallados para la intersección ABC
      detailedElements: [
        {
          id: "ABC-E1",
          name: "Elemento ABC-E1",
          description: "Elemento universal que cumple con todas las propiedades de los tres conjuntos",
          properties: ["Propiedad A1", "Propiedad B2", "Propiedad C3", "Característica universal ABC1"],
          detailedData: [
            { attribute: "Valor numérico", value: "82.7", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo Universal", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Muy Alta", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto A", type: "Nominal" },
            { attribute: "Influencia B", value: "0.95", type: "Cuantitativo" },
            { attribute: "Influencia C", value: "0.88", type: "Cuantitativo" },
            { attribute: "Peso relativo", value: "0.97", type: "Cuantitativo" },
          ],
        },
        {
          id: "ABC-E2",
          name: "Elemento ABC-E2",
          description: "Elemento con distribución equilibrada de propiedades de los tres conjuntos",
          properties: ["Propiedad A3", "Propiedad B1", "Propiedad C2", "Característica universal ABC2"],
          detailedData: [
            { attribute: "Valor numérico", value: "75.3", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo Universal", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Alta", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto B", type: "Nominal" },
            { attribute: "Influencia A", value: "0.87", type: "Cuantitativo" },
            { attribute: "Influencia C", value: "0.92", type: "Cuantitativo" },
            { attribute: "Peso relativo", value: "0.93", type: "Cuantitativo" },
          ],
        },
        {
          id: "ABC-E3",
          name: "Elemento ABC-E3",
          description: "Elemento con predominancia del conjunto C pero presente en todos",
          properties: ["Propiedad A2", "Propiedad B3", "Propiedad C1", "Característica universal ABC3"],
          detailedData: [
            { attribute: "Valor numérico", value: "68.9", type: "Cuantitativo" },
            { attribute: "Clasificación", value: "Tipo Universal", type: "Cualitativo" },
            { attribute: "Frecuencia", value: "Media", type: "Ordinal" },
            { attribute: "Origen", value: "Conjunto C", type: "Nominal" },
            { attribute: "Influencia A", value: "0.81", type: "Cuantitativo" },
            { attribute: "Influencia B", value: "0.79", type: "Cuantitativo" },
            { attribute: "Peso relativo", value: "0.89", type: "Cuantitativo" },
          ],
        },
      ],
    },
  }

  return sectionInfo[section]
}

// Función para verificar si una sección es una intersección
export function isIntersection(section: string) {
  return section.length > 1
}

