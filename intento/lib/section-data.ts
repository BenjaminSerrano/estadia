import { Circle, CheckCircle } from "lucide-react"

import { getTableStats, getIntersectionStats, mapSectionToTable, mapSectionToComparisonTable } from "./api-service"

// Variable to store cached statistics data
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
const CACHE_TTL = 60000; // 1 minute cache

// Function to get information from a specific section
export async function fetchSectionStats(section: string): Promise<{elements: number, uniqueProperties: number, pathwaysList?: string[], commonGenes?: string[]} | null> {
  const tableData = mapSectionToTable(section);

  if (!tableData) return null;

  // Check if it's a simple section or an intersection
  const isIntersectionSection = Array.isArray(tableData);
  const cacheKey = isIntersectionSection ? tableData.join('_') : tableData;

  // Check if there is cached data and if it's valid
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
      // It's an intersection, check if we have a direct comparison table
      const comparisonTable = mapSectionToComparisonTable(section);

      if (comparisonTable) {
        // Use direct comparison table (16_38, 16_41, 38_41)
        console.log(`Using comparison table ${comparisonTable} for section ${section}`);
        const stats = await getTableStats(comparisonTable);

        // Update cache
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
        // Use the original intersection method for complex cases (ABC)
        const stats = await getIntersectionStats(tableData as string[]);

        // Update cache
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
      // It's an individual table
      const stats = await getTableStats(tableData as string);

      // Update cache
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
    console.error(`Error obtaining statistics for section ${section}:`, error);
    return null;
  }
}

// Function to get information from a specific section
export function getSectionInfo(section: string) {
  const sectionInfo: any = {
    A: {
      title: "Genes at 16°C",
      description:
        "This set represents genes that are exclusively expressed at 16°C, with no overlap with other temperatures.",
      color: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
      borderColor: "border-purple-200 dark:border-purple-700",
      icon: Circle,
      iconClassName: "w-6 h-6 text-purple-500",
      accentColor: "text-purple-600 dark:text-purple-400",
      // Minimal structure to maintain UI compatibility
      data: []
    },
    B: {
      title: "Genes at 38°C",
      description:
        "This set represents genes that are exclusively expressed at 38°C, with no overlap with other temperatures.",
      color: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
      borderColor: "border-blue-200 dark:border-blue-700",
      icon: Circle,
      iconClassName: "w-6 h-6 text-blue-500",
      accentColor: "text-blue-600 dark:text-blue-400",
      // Minimal structure to maintain UI compatibility
      data: []
    },
    C: {
      title: "Genes at 41°C",
      description:
        "This set represents genes that are exclusively expressed at 41°C, with no overlap with other temperatures.",
      color: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30",
      borderColor: "border-pink-200 dark:border-pink-700",
      icon: Circle,
      iconClassName: "w-6 h-6 text-pink-500",
      accentColor: "text-pink-600 dark:text-pink-400",
      // Minimal structure to maintain UI compatibility
      data: []
    },
    AB: {
      title: "Common genes: 16°C and 38°C",
      description:
        "This intersection represents genes that are expressed at both 16°C and 38°C, but not at 41°C.",
      color: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30",
      borderColor: "border-indigo-200 dark:border-indigo-700",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-indigo-500",
      accentColor: "text-indigo-600 dark:text-indigo-400",
      // Minimal structure to maintain UI compatibility
      data: [],
      // Placeholder for UI compatibility
      detailedElements: []
    },
    AC: {
      title: "Common genes: 16°C and 41°C",
      description:
        "This intersection represents genes that are expressed at both 16°C and 41°C, but not at 38°C.",
      color: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/30 dark:to-fuchsia-800/30",
      borderColor: "border-fuchsia-200 dark:border-fuchsia-700",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-fuchsia-500",
      accentColor: "text-fuchsia-600 dark:text-fuchsia-400",
      // Minimal structure to maintain UI compatibility
      data: [],
      // Placeholder for UI compatibility
      detailedElements: []
    },
    BC: {
      title: "Common genes: 38°C and 41°C",
      description:
        "This intersection represents genes that are expressed at both 38°C and 41°C, but not at 16°C.",
      color: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30",
      borderColor: "border-violet-200 dark:border-violet-700",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-violet-500",
      accentColor: "text-violet-600 dark:text-violet-400",
      // Minimal structure to maintain UI compatibility
      data: [],
      // Placeholder for UI compatibility
      detailedElements: []
    },
    ABC: {
      title: "Common genes at all temperatures",
      description:
        "This central intersection represents genes that are expressed at all three temperatures: 16°C, 38°C, and 41°C.",
      color: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
      borderColor: "border-slate-200 dark:border-slate-600",
      icon: CheckCircle,
      checkClassName: "w-6 h-6 text-slate-500",
      accentColor: "text-slate-700 dark:text-slate-300",
      // Minimal structure to maintain UI compatibility
      data: [],
      // Placeholder for UI compatibility
      detailedElements: []
    },
  }

  return sectionInfo[section]
}

// Function to check if a section is an intersection
export function isIntersection(section: string) {
  return section.length > 1
}


