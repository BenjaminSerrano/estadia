/**
 * Servicio para interactuar con la API del backend
 */

// URL base de la API - dinámica para desarrollo y producción
const API_BASE_URL = 'estadia-production.up.railway.app'

// Default timeout for API requests (10 seconds)
const DEFAULT_TIMEOUT = 10000;

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('API_BASE_URL configured as:', API_BASE_URL);
}

/**
 * Fetch with timeout support
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise with fetch response
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Safely parse a value to a number
 * @param value - Value to parse (can be string, number, or any)
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Parsed number or default value
 */
function safeParseNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);

  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse a value to an integer
 * @param value - Value to parse (can be string, number, or any)
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Parsed integer or default value
 */
function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = typeof value === 'string' ? parseInt(value, 10) : Math.floor(Number(value));

  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
}

// Función para obtener estadísticas de intersección de tablas
export async function getIntersectionStats(tables: string[]): Promise<IntersectionStats> {
  try {
    // En modo desarrollo o pruebas podemos activar este flag para usar datos simulados
    const USE_MOCK_DATA = false;
    
    // Si estamos en modo prueba o desarrollo, usamos datos simulados
    if (USE_MOCK_DATA) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data for table intersection');
      }
      
      // Datos simulados para cada intersección
      const intersectionData: Record<string, IntersectionStats> = {
        '16_38': {
          total_rows: 89,
          unique_pathways: 15,
          pathways_list: [
            "Human Diseases", "Organismal Systems", "Metabolism", 
            "Environmental Information Processing", "Genetic Information Processing"
          ],
          common_genes: ["gene1", "gene2", "gene3", "gene4", "gene5"]
        },
        '16_41': {
          total_rows: 75,
          unique_pathways: 12,
          pathways_list: [
            "Metabolism", "Cellular Processes", "Environmental Information Processing", 
            "Genetic Information Processing", "Human Diseases"
          ],
          common_genes: ["geneA", "geneB", "geneC", "geneD", "geneE"]
        },
        '38_41': {
          total_rows: 113,
          unique_pathways: 18,
          pathways_list: [
            "Organismal Systems", "Metabolism", "Cellular Processes", 
            "Environmental Information Processing", "Genetic Information Processing"
          ],
          common_genes: ["geneX", "geneY", "geneZ", "geneW", "geneV"]
        },
        '16_38_41': {
          total_rows: 47,
          unique_pathways: 9,
          pathways_list: [
            "Metabolism", "Environmental Information Processing", "Genetic Information Processing"
          ],
          common_genes: ["commonGene1", "commonGene2", "commonGene3", "commonGene4", "commonGene5"]
        }
      };
      
      // Ordenar las tablas para formar la clave correcta
      const sortedTables = [...tables].sort();
      const key = sortedTables.join('_');
      
      // Simular un pequeño retraso para imitar una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return intersectionData[key] || {
        total_rows: 0,
        unique_pathways: 0,
        pathways_list: [],
        common_genes: []
      };
    } else {
      // In production, make API call
      const url = `${API_BASE_URL}/intersection/${tables.join('/')}/stats`;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Getting statistics for table intersection: ${tables.join('/')}`);
      }

      // Make API call with timeout
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener estadísticas de intersección: ${response.statusText}`);
      }

      const data = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('Intersection data received:', data);
      }

      return data;
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de intersección:', error);
    // Retornar valores por defecto en caso de error
    return {
      total_rows: 0,
      unique_pathways: 0,
      pathways_list: [],
      common_genes: []
    };
  }
}

/**
 * Interfaz para las estadísticas de tabla
 */
export interface TableStats {
  total_rows: number;
  unique_pathways: number;
  pathways_list: string[];
}

/**
 * Interfaz para las estadísticas de intersección de tablas
 */
export interface IntersectionStats {
  total_rows: number;
  unique_pathways: number;
  pathways_list: string[];
  common_genes: string[];
}

/**
 * Interfaz para las propiedades (pathways)
 */
export interface PathwaysData {
  pathways: string[];
}

/**
 * Interfaz para los genes
 */
export interface Gene {
  id: number;
  locustag: string;
  KO_code: string;
  Protein_accession: string;
  Name: string;
  log2FoldChange: string;
  pvalue: number;
  padj: number;
  Accession: string;
  Begin: number;
  End: number;
  Protein_length: number;
  Orientation: string;
  Pathway: string;
  Brite_specific_family_1: string;
  Brite_specific_family_2: string;
  Brite_specific_family_3: string;
  Brite_protein_families_1: string;
  Brite_protein_families_2: string;
  Brite_protein_families_3: string;
}

/**
 * Interfaz específica para genes de intersección 16_38
 */
export interface IntersectionGene_16_38 {
  ID: number;
  Locustag: string;
  KO_code_16: string;
  KO_code_38: string;
  Protein_accession_16: string;
  Name_16: string;
  log2FoldChange_16: string;
  pvalue_16: number;
  padj_16: number;
  Accession_16: string;
  Begin_16: number;
  End_16: number;
  Protein_length_16: number;
  Orientation_16: string;
  Protein_accession_38: string;
  Name_38: string;
  log2FoldChange_38: string;
  pvalue_38: number;
  padj_38: number;
  Accession_38: string;
  Begin_38: number;
  End_38: number;
  Protein_length_38: number;
  Orientation_38: string;
  Pathway: string;
  Brite_specific_family_1: string;
  Brite_specific_family_2: string;
  Brite_specific_family_3: string;
  Brite_protein_families_1: string;
  Brite_protein_families_2: string;
  Brite_protein_families_3: string;
  // Campos de compatibilidad
  KO_code?: string;
  Name?: string;
  Protein_accession?: string;
  locustag?: string;
}

/**
 * Interfaz específica para genes de intersección 16_41
 */
export interface IntersectionGene_16_41 {
  ID: number;
  Locustag: string;
  KO_code_16: string;
  KO_code_41: string;
  Protein_accession_16: string;
  Name_16: string;
  log2FoldChange_16: string;
  pvalue_16: number;
  padj_16: number;
  Accession_16: string;
  Begin_16: number;
  End_16: number;
  Protein_length_16: number;
  Orientation_16: string;
  Protein_accession_41: string;
  Name_41: string;
  log2FoldChange_41: string;
  pvalue_41: number;
  padj_41: number;
  Accession_41: string;
  Begin_41: number;
  End_41: number;
  Protein_length_41: number;
  Orientation_41: string;
  Pathway: string;
  Brite_specific_family_1: string;
  Brite_specific_family_2: string;
  Brite_specific_family_3: string;
  Brite_protein_families_1: string;
  Brite_protein_families_2: string;
  Brite_protein_families_3: string;
  // Campos de compatibilidad
  KO_code?: string;
  Name?: string;
  Protein_accession?: string;
  locustag?: string;
}

/**
 * Interfaz específica para genes de intersección 38_41
 */
export interface IntersectionGene_38_41 {
  ID: number;
  Locustag: string;
  KO_code_38: string;
  KO_code_41: string;
  Protein_accession_38: string;
  Name_38: string;
  log2FoldChange_38: string;
  pvalue_38: number;
  padj_38: number;
  Accession_38: string;
  Begin_38: number;
  End_38: number;
  Protein_length_38: number;
  Orientation_38: string;
  Protein_accession_41: string;
  Name_41: string;
  log2FoldChange_41: string;
  pvalue_41: number;
  padj_41: number;
  Accession_41: string;
  Begin_41: number;
  End_41: number;
  Protein_length_41: number;
  Orientation_41: string;
  Pathway: string;
  Brite_specific_family_1: string;
  Brite_specific_family_2: string;
  Brite_specific_family_3: string;
  Brite_protein_families_1: string;
  Brite_protein_families_2: string;
  Brite_protein_families_3: string;
  // Campos de compatibilidad
  KO_code?: string;
  Name?: string;
  Protein_accession?: string;
  locustag?: string;
}

/**
 * Interfaz específica para genes de intersección 16_38_41
 */
export interface IntersectionGene_16_38_41 {
  ID: number;
  Locustag: string;
  KO_code_16: string;
  KO_code_41: string;
  Protein_accession_16: string;
  Name_16: string;
  log2FoldChange_16: string;
  pvalue_16: number;
  padj_16: number;
  Accession_16: string;
  Begin_16: number;
  End_16: number;
  Protein_length_16: number;
  Orientation_16: string;
  Protein_accession_38: string;
  Name_38: string;
  log2FoldChange_38: string;
  pvalue_38: number;
  padj_38: number;
  Accession_38: string;
  Begin_38: number;
  End_38: number;
  Protein_length_38: number;
  Orientation_38: string;
  KO_code_38: string;
  Protein_accession_41: string;
  Name_41: string;
  log2FoldChange_41: string;
  pvalue_41: number;
  padj_41: number;
  Accession_41: string;
  Begin_41: number;
  End_41: number;
  Protein_length_41: number;
  Orientation_41: string;
  Pathways: string;
  Brite_protein_families_1: string;
  Brite_specific_family_1: string;
  Brite_protein_families_2: string;
  Brite_specific_family_2: string;
  Brite_protein_families_3: string;
  Brite_specific_family_3: string;
  // Campos de compatibilidad
  KO_code?: string;
  Name?: string;
  Protein_accession?: string;
  locustag?: string;
}

/**
 * Unión de todos los tipos de genes de intersección
 */
export type IntersectionGene = IntersectionGene_16_38 | IntersectionGene_16_41 | IntersectionGene_38_41 | IntersectionGene_16_38_41;

/**
 * Interfaz para la respuesta de genes filtrados (tablas individuales)
 */
export interface GeneFilterResponse {
  genes: Gene[];
}

/**
 * Interfaz para la respuesta de genes de intersección filtrados
 */
export interface IntersectionGeneFilterResponse {
  genes: IntersectionGene[];
}

/**
 * Respuesta unificada que puede contener cualquier tipo de gene
 */
export interface UnifiedGeneFilterResponse {
  genes: (Gene | IntersectionGene)[];
}

/**
 * Obtiene estadísticas de una tabla específica
 * @param tableName - Nombre de la tabla (16, 38, 41)
 * @returns Promesa con las estadísticas de la tabla
 */
export async function getTableStats(tableName: string): Promise<TableStats> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/${tableName}`);

    if (!response.ok) {
      throw new Error(`Error al obtener estadísticas: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    // Retornar valores por defecto en caso de error
    return {
      total_rows: 0,
      unique_pathways: 0,
      pathways_list: []
    };
  }
}

/**
 * Obtiene las propiedades (pathways) de una tabla específica
 * @param tableName - Nombre de la tabla (16, 38, 41)
 * @returns Promesa con las propiedades de la tabla
 */
export async function getTablePathways(tableName: string): Promise<PathwaysData> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/pathways/${tableName}`);

    if (!response.ok) {
      throw new Error(`Error al obtener propiedades: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error obteniendo propiedades:', error);
    // Retornar valores por defecto en caso de error
    return {
      pathways: []
    };
  }
}

/**
 * Obtiene todos los genes de una tabla sin filtro de pathway
 * @param tableName - Nombre de la tabla (16, 38, 41, 16_38, 16_41, 38_41, 16_38_41)
 * @returns Promesa con todos los genes de la tabla
 */
export async function getAllGenes(tableName: string): Promise<UnifiedGeneFilterResponse> {
  try {
    const url = `${API_BASE_URL}/genes/all/${tableName}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Calling API URL for all data:', url);
    }

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Response status (all data):', response.status, response.statusText);
    }

    if (!response.ok) {
      throw new Error(`Error getting all genes: ${response.statusText}`);
    }

    const data = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.log(`All data obtained: ${data?.genes?.length || 0} genes`);
    }
    
    return data;
  } catch (error) {
    console.error('Error obteniendo todos los genes:', error);
    return { genes: [] };
  }
}

/**
 * Obtiene los genes de una tabla filtrados por pathway
 * @param tableName - Nombre de la tabla (16, 38, 41, 16_38, 16_41, 38_41, 16_38_41)
 * @param pathway - Ruta para filtrar los genes o "__TODOS_LOS_DATOS__" para obtener todos
 * @returns Promesa con los genes filtrados
 */
export async function getGenesByPathway(tableName: string, pathway: string): Promise<UnifiedGeneFilterResponse> {
  try {
    // Special case: if pathway is "__TODOS_LOS_DATOS__", use getAllGenes function
    if (pathway === "__TODOS_LOS_DATOS__") {
      if (process.env.NODE_ENV === 'development') {
        console.log('Getting all data from table:', tableName);
      }
      return await getAllGenes(tableName);
    }
    
    // Encode pathway for URL (in case it contains special characters)
    const encodedPathway = encodeURIComponent(pathway);

    // Build correct URL for backend
    const url = `${API_BASE_URL}/genes/filter/${tableName}/${encodedPathway}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Calling API URL:', url);

      // Special logging for Metabolism in table 41
      if (tableName === "41" && pathway.toLowerCase() === "metabolism") {
        console.log('⚠️ Special case: Requesting Metabolism pathway in table 41 (should return 107 genes)');
      }
    }
    
    // Use explicit GET method and configure headers to accept JSON
    // Add timestamp to avoid potential cache issues
    const timestamp = new Date().getTime();
    const response = await fetchWithTimeout(`${url}?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Ensure no cache is sent to get fresh data
      cache: 'no-store'
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Response status:', response.status, response.statusText);
    }

    if (!response.ok) {
      throw new Error(`Error al obtener genes: ${response.statusText}`);
    }

    // Convert response to text first for debugging
    const responseText = await response.text();

    // Try to parse text to JSON
    let data: any;
    try {
      data = JSON.parse(responseText);

      if (process.env.NODE_ENV === 'development') {
        console.log('Response text:', responseText.substring(0, 200) + '...');
        console.log('Data parsed correctly:', data ? 'OK' : 'Null');

        // Specific verification for Metabolism
        if (tableName === "41" && pathway.toLowerCase() === "metabolism") {
          console.log(`🔍 Verifying count: ${data?.genes?.length || 0} genes (expected: 107)`);

          if (data?.genes?.length !== 107) {
            console.warn(`⚠️ Incorrect count for Metabolism in table 41: ${data?.genes?.length || 0} genes (expected: 107)`);
          } else {
            console.log('✓ Correct: 107 genes found for Metabolism in table 41');
          }
        }
      }
    } catch (parseError) {
      console.error('Error al parsear JSON:', parseError);
      return { genes: [] };
    }

    // Ensure data has correct format
    if (data && typeof data === 'object' && 'genes' in data) {
      // Validate that genes is an array and not undefined
      if (!Array.isArray(data.genes)) {
        if (process.env.NODE_ENV === 'development') {
          console.error('The genes property is not an array:', data.genes);
        }
        return { genes: [] };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`Data contains 'genes' property with ${data.genes.length} elements`);
      }
      
      // Determinar si es una tabla de intersección o individual
      const isIntersectionTable = ['16_38', '16_41', '38_41', '16_38_41'].includes(tableName);
      
      // Validar y procesar genes según el tipo de tabla
      const validatedGenes = data.genes.map((gene: any) => {
        if (!gene || typeof gene !== 'object') {
          // Retornar objeto básico según el tipo de tabla
          if (isIntersectionTable) {
            return {
              ID: 0,
              Locustag: "-",
              Pathway: "-",
              Brite_specific_family_1: "-",
              Brite_specific_family_2: "-",
              Brite_specific_family_3: "-",
              Brite_protein_families_1: "-",
              Brite_protein_families_2: "-",
              Brite_protein_families_3: "-",
              // Campos de compatibilidad
              Name: "-",
              KO_code: "-",
              Protein_accession: "-",
              locustag: "-"
            };
          } else {
            return {
              id: 0,
              Name: "-",
              KO_code: "-",
              Protein_accession: "-",
              locustag: "-",
              log2FoldChange: "-",
              pvalue: 0,
              padj: 0,
              Accession: "-",
              Begin: 0,
              End: 0,
              Protein_length: 0,
              Orientation: "-",
              Pathway: "-",
              Brite_specific_family_1: "-",
              Brite_specific_family_2: "-",
              Brite_specific_family_3: "-",
              Brite_protein_families_1: "-",
              Brite_protein_families_2: "-",
              Brite_protein_families_3: "-"
            };
          }
        }
        
        if (isIntersectionTable) {
          // Para tablas de intersección, preservar la estructura exacta del backend
          const intersectionGene: any = {
            // Campos comunes a todas las intersecciones
            ID: gene.ID || gene.id || 0,
            Locustag: gene.Locustag || gene.locustag || "-",
            Pathway: gene.Pathway || gene.Pathways || "-",
            Brite_specific_family_1: gene.Brite_specific_family_1 || "-",
            Brite_specific_family_2: gene.Brite_specific_family_2 || "-",
            Brite_specific_family_3: gene.Brite_specific_family_3 || "-",
            Brite_protein_families_1: gene.Brite_protein_families_1 || "-",
            Brite_protein_families_2: gene.Brite_protein_families_2 || "-",
            Brite_protein_families_3: gene.Brite_protein_families_3 || "-"
          };
          
          // Agregar campos específicos según la tabla de intersección
          if (tableName === '16_38') {
            intersectionGene.KO_code_16 = gene.KO_code_16 || "-";
            intersectionGene.KO_code_38 = gene.KO_code_38 || "-";
            intersectionGene.Name_16 = gene.Name_16 || "-";
            intersectionGene.Name_38 = gene.Name_38 || "-";
            intersectionGene.Protein_accession_16 = gene.Protein_accession_16 || "-";
            intersectionGene.Protein_accession_38 = gene.Protein_accession_38 || "-";
            intersectionGene.log2FoldChange_16 = gene.log2FoldChange_16 || "-";
            intersectionGene.log2FoldChange_38 = gene.log2FoldChange_38 || "-";
            intersectionGene.pvalue_16 = safeParseNumber(gene.pvalue_16);
            intersectionGene.pvalue_38 = safeParseNumber(gene.pvalue_38);
            intersectionGene.padj_16 = safeParseNumber(gene.padj_16);
            intersectionGene.padj_38 = safeParseNumber(gene.padj_38);
          } else if (tableName === '16_41') {
            intersectionGene.KO_code_16 = gene.KO_code_16 || "-";
            intersectionGene.KO_code_41 = gene.KO_code_41 || "-";
            intersectionGene.Name_16 = gene.Name_16 || "-";
            intersectionGene.Name_41 = gene.Name_41 || "-";
            intersectionGene.Protein_accession_16 = gene.Protein_accession_16 || "-";
            intersectionGene.Protein_accession_41 = gene.Protein_accession_41 || "-";
            intersectionGene.log2FoldChange_16 = gene.log2FoldChange_16 || "-";
            intersectionGene.log2FoldChange_41 = gene.log2FoldChange_41 || "-";
            intersectionGene.pvalue_16 = safeParseNumber(gene.pvalue_16);
            intersectionGene.pvalue_41 = safeParseNumber(gene.pvalue_41);
            intersectionGene.padj_16 = safeParseNumber(gene.padj_16);
            intersectionGene.padj_41 = safeParseNumber(gene.padj_41);
          } else if (tableName === '38_41') {
            intersectionGene.KO_code_38 = gene.KO_code_38 || "-";
            intersectionGene.KO_code_41 = gene.KO_code_41 || "-";
            intersectionGene.Name_38 = gene.Name_38 || "-";
            intersectionGene.Name_41 = gene.Name_41 || "-";
            intersectionGene.Protein_accession_38 = gene.Protein_accession_38 || "-";
            intersectionGene.Protein_accession_41 = gene.Protein_accession_41 || "-";
            intersectionGene.log2FoldChange_38 = gene.log2FoldChange_38 || "-";
            intersectionGene.log2FoldChange_41 = gene.log2FoldChange_41 || "-";
            intersectionGene.pvalue_38 = safeParseNumber(gene.pvalue_38);
            intersectionGene.pvalue_41 = safeParseNumber(gene.pvalue_41);
            intersectionGene.padj_38 = safeParseNumber(gene.padj_38);
            intersectionGene.padj_41 = safeParseNumber(gene.padj_41);
          } else if (tableName === '16_38_41') {
            intersectionGene.KO_code_16 = gene.KO_code_16 || "-";
            intersectionGene.KO_code_38 = gene.KO_code_38 || "-";
            intersectionGene.KO_code_41 = gene.KO_code_41 || "-";
            intersectionGene.Name_16 = gene.Name_16 || "-";
            intersectionGene.Name_38 = gene.Name_38 || "-";
            intersectionGene.Name_41 = gene.Name_41 || "-";
            intersectionGene.Protein_accession_16 = gene.Protein_accession_16 || "-";
            intersectionGene.Protein_accession_38 = gene.Protein_accession_38 || "-";
            intersectionGene.Protein_accession_41 = gene.Protein_accession_41 || "-";
            intersectionGene.log2FoldChange_16 = gene.log2FoldChange_16 || "-";
            intersectionGene.log2FoldChange_38 = gene.log2FoldChange_38 || "-";
            intersectionGene.log2FoldChange_41 = gene.log2FoldChange_41 || "-";
            intersectionGene.pvalue_16 = safeParseNumber(gene.pvalue_16);
            intersectionGene.pvalue_38 = safeParseNumber(gene.pvalue_38);
            intersectionGene.pvalue_41 = safeParseNumber(gene.pvalue_41);
            intersectionGene.padj_16 = safeParseNumber(gene.padj_16);
            intersectionGene.padj_38 = safeParseNumber(gene.padj_38);
            intersectionGene.padj_41 = safeParseNumber(gene.padj_41);
            intersectionGene.Pathways = gene.Pathways || "-";
          }
          
          // Agregar campos de compatibilidad para el frontend
          intersectionGene.Name = intersectionGene.Name_16 || intersectionGene.Name_38 || intersectionGene.Name_41 || "-";
          intersectionGene.KO_code = intersectionGene.KO_code_16 || intersectionGene.KO_code_38 || intersectionGene.KO_code_41 || "-";
          intersectionGene.Protein_accession = intersectionGene.Protein_accession_16 || intersectionGene.Protein_accession_38 || intersectionGene.Protein_accession_41 || "-";
          intersectionGene.locustag = intersectionGene.Locustag || "-";
          
          return intersectionGene;
        } else {
          // Para tablas individuales, usar la estructura original
          const individualGene = {
            id: gene.id || gene.ID || 0,
            Name: gene.Name || "-",
            KO_code: gene.KO_code || "-",
            Protein_accession: gene.Protein_accession || "-",
            locustag: gene.locustag || "-",
            log2FoldChange: gene.log2FoldChange || "-",
            pvalue: safeParseNumber(gene.pvalue),
            padj: safeParseNumber(gene.padj),
            Accession: gene.Accession || "-",
            Begin: safeParseInt(gene.Begin),
            End: safeParseInt(gene.End),
            Protein_length: safeParseInt(gene.Protein_length),
            Orientation: gene.Orientation || "-",
            Pathway: gene.Pathway || "-",
            Brite_specific_family_1: gene.Brite_specific_family_1 || "-",
            Brite_specific_family_2: gene.Brite_specific_family_2 || "-",
            Brite_specific_family_3: gene.Brite_specific_family_3 || "-",
            Brite_protein_families_1: gene.Brite_protein_families_1 || "-",
            Brite_protein_families_2: gene.Brite_protein_families_2 || "-",
            Brite_protein_families_3: gene.Brite_protein_families_3 || "-"
          };

          return individualGene;
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Validated ${validatedGenes.length} genes correctly`);
        // Show sample of processed data
        if (validatedGenes.length > 0) {
          console.log('Sample of first validated gene:', validatedGenes[0]);
        }
      }

      return { genes: validatedGenes };
    }
    
    console.error('Respuesta inesperada de la API:', data);
    return { genes: [] };
  } catch (error) {
    console.error('Error obteniendo genes por pathway:', error);
    // Retornar valores por defecto en caso de error
    return {
      genes: []
    };
  }
}

// FUNCIÓN ELIMINADA: getIntersectionGenesByPathway
// Ya no necesitamos esta función porque el backend devuelve la estructura exacta
// de cada tabla. Usamos directamente getGenesByPathway para todas las tablas.

/**
 * Mapea secciones del diagrama de Venn a tablas en la base de datos
 * @param section - Identificador de sección del diagrama (A, B, C, AB, etc.)
 * @returns El nombre de la tabla correspondiente (16, 38, 41) o un array de nombres para intersecciones
 */
/**
 * Obtiene estadísticas directas de las tablas de comparación (16_38, 16_41, 38_41)
 * @param tableId - ID de la tabla de comparación (16_38, 16_41, 38_41)
 * @returns Promesa con las estadísticas de la tabla de comparación
 */
export async function getComparisonTableStats(tableId: string): Promise<TableStats> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Getting comparison table statistics: ${tableId}`);
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/${tableId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error al obtener estadísticas de comparación: ${response.statusText}`);
    }

    const data = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.log(`Statistics for table ${tableId}:`, data);
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo estadísticas de tabla de comparación:', error);
    return {
      total_rows: 0,
      unique_pathways: 0,
      pathways_list: []
    };
  }
}

/**
 * Obtiene los pathways de las tablas de comparación
 * @param tableId - ID de la tabla de comparación (16_38, 16_41, 38_41)
 * @returns Promesa con los pathways de la tabla de comparación
 */
export async function getComparisonTablePathways(tableId: string): Promise<PathwaysData> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Getting pathways from comparison table: ${tableId}`);
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/pathways/${tableId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error al obtener pathways de comparación: ${response.statusText}`);
    }

    const data = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.log(`Pathways for table ${tableId}:`, data);
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo pathways de tabla de comparación:', error);
    return {
      pathways: []
    };
  }
}

export function mapSectionToTable(section: string): string | string[] | null {
  // Mapeamos cada sección a su tabla correspondiente
  const sectionToTableMap: Record<string, string | string[]> = {
    'A': '16',  // Conjunto A corresponde a la tabla 16
    'B': '38',  // Conjunto B corresponde a la tabla 38
    'C': '41',  // Conjunto C corresponde a la tabla 41
    'AB': ['16', '38'],  // Intersección AB corresponde a tablas 16 y 38
    'AC': ['16', '41'],  // Intersección AC corresponde a tablas 16 y 41
    'BC': ['38', '41'],  // Intersección BC corresponde a tablas 38 y 41
    'ABC': ['16', '38', '41']  // Intersección ABC corresponde a las tres tablas
  };

  return sectionToTableMap[section] || null;
}

/**
 * Mapea secciones de intersección a nombres de tablas de comparación
 * @param section - Identificador de sección del diagrama (AB, AC, BC)
 * @returns El nombre de la tabla de comparación correspondiente
 */
export function mapSectionToComparisonTable(section: string): string | null {
  const sectionToComparisonTableMap: Record<string, string> = {
    'AB': '16_38',  // Intersección AB corresponde a la tabla 16_38
    'AC': '16_41',  // Intersección AC corresponde a la tabla 16_41
    'BC': '38_41',  // Intersección BC corresponde a la tabla 38_41
    'ABC': '16_38_41',  // Intersección ABC corresponde a la tabla 16_38_41
  };

  return sectionToComparisonTableMap[section] || null;
}