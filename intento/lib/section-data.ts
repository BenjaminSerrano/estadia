import { Circle, CheckCircle } from "lucide-react"

import { getTableStats, getIntersectionStats, getGenesByPathway, mapSectionToTable, getComparisonTableStats, getComparisonTablePathways, mapSectionToComparisonTable } from "./api-service"

// Variable para almacenar en caché los datos de estadísticas
interface StatsCache {
  [key: string]: {
    total_rows: number;
    unique_pathways: number;
    pathways_list?: string[];
    common_genes?: string[];
    timestamp: number;
  }
}

const statsCache: StatsCache = {};
const CACHE_TTL = 60000; // 1 minuto de caché

// Función para obtener la información de una sección específica
export async function fetchSectionStats(section: string): Promise<{elements: number, uniqueProperties: number, pathwaysList?: string[], commonGenes?: string[]} | null> {
  const tableData = mapSectionToTable(section);

  if (!tableData) return null;
  
  // Verificar si es una sección simple o una intersección
  const isIntersectionSection = Array.isArray(tableData);
  const cacheKey = isIntersectionSection ? tableData.join('_') : tableData;

  // Verificar si hay datos en caché y si son válidos
  const now = Date.now();
  if (statsCache[cacheKey] && (now - statsCache[cacheKey].timestamp < CACHE_TTL)) {
    return {
      elements: statsCache[cacheKey].total_rows,
      uniqueProperties: statsCache[cacheKey].unique_pathways,
      pathwaysList: statsCache[cacheKey].pathways_list,
      commonGenes: statsCache[cacheKey].common_genes
    };
  }

  try {
    if (isIntersectionSection) {
      // Es una intersección, verificar si tenemos una tabla de comparación directa
      const comparisonTable = mapSectionToComparisonTable(section);
      
      if (comparisonTable) {
        // Usar tabla de comparación directa (16_38, 16_41, 38_41)
        console.log(`Usando tabla de comparación ${comparisonTable} para sección ${section}`);
        const stats = await getComparisonTableStats(comparisonTable);

        // Actualizar caché
        statsCache[cacheKey] = {
          total_rows: stats.total_rows,
          unique_pathways: stats.unique_pathways,
          pathways_list: stats.pathways_list,
          timestamp: now
        };

        return {
          elements: stats.total_rows,
          uniqueProperties: stats.unique_pathways,
          pathwaysList: stats.pathways_list
        };
      } else {
        // Usar el método de intersección original para casos complejos (ABC)
        const stats = await getIntersectionStats(tableData as string[]);

        // Actualizar caché
        statsCache[cacheKey] = {
          total_rows: stats.total_rows,
          unique_pathways: stats.unique_pathways,
          pathways_list: stats.pathways_list,
          common_genes: stats.common_genes,
          timestamp: now
        };

        return {
          elements: stats.total_rows,
          uniqueProperties: stats.unique_pathways,
          pathwaysList: stats.pathways_list,
          commonGenes: stats.common_genes
        };
      }
    } else {
      // Es una tabla individual
      const stats = await getTableStats(tableData as string);

      // Actualizar caché
      statsCache[cacheKey] = {
        total_rows: stats.total_rows,
        unique_pathways: stats.unique_pathways,
        pathways_list: stats.pathways_list,
        timestamp: now
      };

      return {
        elements: stats.total_rows,
        uniqueProperties: stats.unique_pathways,
        pathwaysList: stats.pathways_list
      };
    }
  } catch (error) {
    console.error(`Error obteniendo estadísticas para la sección ${section}:`, error);
    return null;
  }
}

// Función para obtener la información de una sección específica
export function getSectionInfo(section: string) {
  const sectionInfo: any = {
    A: {
      title: "Genes a 16°C",
      description:
        "Este conjunto representa genes que se expresan exclusivamente a 16°C, sin solapamiento con otras temperaturas.",
      color: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
      borderColor: "border-purple-200 dark:border-purple-700",
      icon: Circle,
      iconClassName: "w-6 h-6 text-purple-500",
      accentColor: "text-purple-600 dark:text-purple-400",
      // Estructura mínima para mantener compatibilidad con la UI
      data: []
    },
    B: {
      title: "Genes a 38°C",
      description:
        "Este conjunto representa genes que se expresan exclusivamente a 38°C, sin solapamiento con otras temperaturas.",
      color: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
      borderColor: "border-blue-200 dark:border-blue-700",
      icon: Circle,
      iconClassName: "w-6 h-6 text-blue-500",
      accentColor: "text-blue-600 dark:text-blue-400",
      // Estructura mínima para mantener compatibilidad con la UI
      data: []
    },
    C: {
      title: "Genes a 41°C",
      description:
        "Este conjunto representa genes que se expresan exclusivamente a 41°C, sin solapamiento con otras temperaturas.",
      color: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30",
      borderColor: "border-pink-200 dark:border-pink-700",
      icon: Circle,
      iconClassName: "w-6 h-6 text-pink-500",
      accentColor: "text-pink-600 dark:text-pink-400",
      // Estructura mínima para mantener compatibilidad con la UI
      data: []
    },
    AB: {
      title: "Genes comunes: 16°C y 38°C",
      description:
        "Esta intersección representa genes que se expresan tanto a 16°C como a 38°C, pero no a 41°C.",
      color: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30",
      borderColor: "border-indigo-200 dark:border-indigo-700",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-indigo-500",
      accentColor: "text-indigo-600 dark:text-indigo-400",
      // Estructura mínima para mantener compatibilidad con la UI
      data: [],
      // Placeholder para compatibilidad con la UI
      detailedElements: []
    },
    AC: {
      title: "Genes comunes: 16°C y 41°C",
      description:
        "Esta intersección representa genes que se expresan tanto a 16°C como a 41°C, pero no a 38°C.",
      color: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/30 dark:to-fuchsia-800/30",
      borderColor: "border-fuchsia-200 dark:border-fuchsia-700",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-fuchsia-500",
      accentColor: "text-fuchsia-600 dark:text-fuchsia-400",
      // Estructura mínima para mantener compatibilidad con la UI
      data: [],
      // Placeholder para compatibilidad con la UI
      detailedElements: []
    },
    BC: {
      title: "Genes comunes: 38°C y 41°C",
      description:
        "Esta intersección representa genes que se expresan tanto a 38°C como a 41°C, pero no a 16°C.",
      color: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30",
      borderColor: "border-violet-200 dark:border-violet-700",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-violet-500",
      accentColor: "text-violet-600 dark:text-violet-400",
      // Estructura mínima para mantener compatibilidad con la UI
      data: [],
      // Placeholder para compatibilidad con la UI
      detailedElements: []
    },
    ABC: {
      title: "Genes comunes en todas las temperaturas",
      description:
        "Esta intersección central representa genes que se expresan en las tres temperaturas: 16°C, 38°C y 41°C.",
      color: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
      borderColor: "border-slate-200 dark:border-slate-600",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-slate-500",
      accentColor: "text-slate-700 dark:text-slate-300",
      // Estructura mínima para mantener compatibilidad con la UI
      data: [],
      // Placeholder para compatibilidad con la UI
      detailedElements: []
    },
  }

  return sectionInfo[section]
}

// Función para verificar si una sección es una intersección
export function isIntersection(section: string) {
  return section.length > 1
}

// Función para obtener genes filtrados por pathway para cualquier sección
export async function getSectionGenesByPathway(section: string, pathway: string) {
  const tableData = mapSectionToTable(section);
  
  if (!tableData) return { genes: [] };
  
  try {
    // Verificar si es una sección simple o una intersección
    const isIntersectionSection = Array.isArray(tableData);
    
    if (isIntersectionSection) {
      // Para intersecciones, mapear a tabla de comparación
      const comparisonTable = mapSectionToComparisonTable(section);
      
      if (comparisonTable) {
        console.log(`Obteniendo genes de intersección ${section} usando tabla ${comparisonTable} con pathway ${pathway}`);
        return await getGenesByPathway(comparisonTable, pathway);
      } else {
        console.error(`No se pudo mapear la intersección ${section} a una tabla de comparación`);
        return { genes: [] };
      }
    } else {
      // Es una tabla individual
      console.log(`Obteniendo genes de tabla ${tableData} con pathway ${pathway}`);
      return await getGenesByPathway(tableData as string, pathway);
    }
  } catch (error) {
    console.error(`Error obteniendo genes para la sección ${section} con pathway ${pathway}:`, error);
    return { genes: [] };
  }
}

