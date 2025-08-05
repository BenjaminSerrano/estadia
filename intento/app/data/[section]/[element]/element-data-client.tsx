"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSectionInfo, isIntersection } from "@/lib/section-data"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Database, Filter, Download, ArrowUpDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGenesByPathway, mapSectionToTable, type Gene, type IntersectionGene } from "@/lib/api-service"

export default function ElementDataClient() {
  const router = useRouter()
  const params = useParams()
  const section = params.section as string
  
  // Convertir el slug de la URL de nuevo al formato original para la API
  const elementSlug = params.element as string
  const element = elementSlug === "__TODOS_LOS_DATOS__" 
    ? "__TODOS_LOS_DATOS__" 
    : elementSlug.replace(/-/g, ' ')

  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("Name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [genesData, setGenesData] = useState<(Gene | IntersectionGene)[]>([])
  const [intersectionGenesData, setIntersectionGenesData] = useState<(Gene | IntersectionGene)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get section info
  const info = getSectionInfo(section)

  // Determinar si estamos viendo un elemento de intersección o un pathway
  const isIntersectionElement = isIntersection(section)
  
  // Helper function to get which temperature columns to show for intersection sections
  const getIntersectionTemperatures = (section: string): string[] => {
    switch (section) {
      case 'AB': return ['16', '38']
      case 'AC': return ['16', '41'] 
      case 'BC': return ['38', '41']
      case 'ABC': return ['16', '38', '41']
      default: return []
    }
  }

  // Helper function to render log2FoldChange with conditional coloring
  const renderLog2FoldChange = (value: any) => {
    if (!value || value === "-" || value === "") {
      return <span className="text-slate-500">-</span>
    }
    
    // Convert to number to check if positive or negative
    const numValue = parseFloat(String(value))
    
    if (isNaN(numValue)) {
      return <span className="text-slate-500">{value}</span>
    }
    
    // Apply conditional styling: green for positive, red for negative
    const colorClass = numValue > 0 ? "text-green-600 dark:text-green-400" : 
                      numValue < 0 ? "text-red-600 dark:text-red-400" : 
                      "text-slate-600 dark:text-slate-400"
    
    return <span className={colorClass}>{value}</span>
  }
  
  // Ahora manejamos tanto conjuntos individuales como intersecciones

  // Fetch data on load - para conjuntos individuales e intersecciones
  useEffect(() => {
    const fetchData = async () => {
      if (!section) {
        console.log('No se cargan datos: no hay sección');
        return;
      }

      try {
        setLoading(true);
        setError(null); // Reset any previous errors
        
        // Determinar qué tabla usar
        let tableName: string;
        if (isIntersectionElement) {
          const tables = mapSectionToTable(section) as string[];
          if (!tables || !Array.isArray(tables)) {
            throw new Error(`No se pudo mapear la intersección "${section}" a tablas válidas.`);
          }
          
          // Mapear a tabla de comparación
          if (section === 'ABC') {
            // Caso especial para ABC - usar la tabla 16_38_41
            tableName = '16_38_41';
          } else if (tables.includes('16') && tables.includes('38') && !tables.includes('41')) {
            tableName = '16_38';
          } else if (tables.includes('16') && tables.includes('41') && !tables.includes('38')) {
            tableName = '16_41';
          } else if (tables.includes('38') && tables.includes('41') && !tables.includes('16')) {
            tableName = '38_41';
          } else {
            throw new Error(`Combinación de tablas no válida: ${tables.join(', ')}`);
          }
          
          console.log(`Obteniendo genes de intersección para tabla ${tableName} con pathway "${element}"`);
        } else {
          tableName = mapSectionToTable(section) as string;
          if (!tableName || Array.isArray(tableName)) {
            throw new Error(`No se pudo mapear la sección "${section}" a una tabla válida.`);
          }
          
          console.log(`Obteniendo genes para tabla ${tableName} con pathway "${element}"`);
        }
        
        // Usar la misma función para ambos casos
        const response = await getGenesByPathway(tableName, element);
        
        // Verificar la respuesta
        if (!response || !response.genes || !Array.isArray(response.genes)) {
          throw new Error('Respuesta inválida');
        }
        
        console.log(`Se encontraron ${response.genes.length} genes en la tabla ${tableName}`);
        
        // Mostrar estructura de los primeros genes para depuración
        if (response.genes.length > 0) {
          console.log('Estructura del primer gen:', response.genes[0]);
          console.log('Campos disponibles:', Object.keys(response.genes[0]));
        }
        
        if (isIntersectionElement) {
          console.log(`✅ Datos de intersección recibidos: ${response.genes.length} genes para tabla ${tableName}`);
          if (response.genes.length > 0) {
            console.log('📊 Primer gene (campos):', Object.keys(response.genes[0]));
            console.log('📊 Primer gene completo:', response.genes[0]);
            console.log('📊 log2FoldChange_16:', (response.genes[0] as any).log2FoldChange_16);
            console.log('📊 log2FoldChange_38:', (response.genes[0] as any).log2FoldChange_38);
            console.log('📊 log2FoldChange_41:', (response.genes[0] as any).log2FoldChange_41);
          }
          setIntersectionGenesData(response.genes);
          setGenesData([]);
        } else {
          console.log(`✅ Datos individuales recibidos: ${response.genes.length} genes para tabla ${tableName}`);
          setGenesData(response.genes);
          setIntersectionGenesData([]);
        }
        
      } catch (err) {
        console.error("Error al obtener genes:", err);
        setError(`Error: ${err instanceof Error ? err.message : 'Ocurrió un problema al cargar los datos'}`);
        setGenesData([]);
        setIntersectionGenesData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [section, element, isIntersectionElement])

  // Redirect if section doesn't exist
  useEffect(() => {
    if (!info) {
      router.push("/")
    }
  }, [info, router])

  if (!info) {
    return <div>Cargando...</div>
  }


  // Filtrar y ordenar los datos usando directamente la estructura del backend
  const filteredAndSortedData = useMemo(() => {
    // Determinar qué datos usar - usar directamente sin procesamiento adicional
    const currentData = isIntersectionElement ? intersectionGenesData : genesData;
    
    if (!currentData || !Array.isArray(currentData) || currentData.length === 0) {
      return [];
    }
    
    // Debug solo para el primer elemento
    if (currentData.length > 0 && isIntersectionElement) {
      console.log('🔍 Primer gene de intersección:', currentData[0]);
      console.log('🔍 Campos disponibles:', Object.keys(currentData[0]));
    }
    
    return currentData
      // Filtrar por término de búsqueda
      .filter((item: any) => {
        if (searchTerm === "") return true;
        
        const searchFields = [
          item.Name,
          item.name,
          item.KO_code,
          item.ko_code,
          item.locustag,
          item.Locustag
        ];
        
        return searchFields.some(field => 
          field && String(field).toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      // Ordenar por campo y dirección
      .sort((a: any, b: any) => {
        const aValue = a[sortField] || a[sortField.toLowerCase()] || "";
        const bValue = b[sortField] || b[sortField.toLowerCase()] || "";
        
        if (sortDirection === "asc") {
          return String(aValue).localeCompare(String(bValue));
        } else {
          return String(bValue).localeCompare(String(aValue));
        }
      });
  }, [genesData, intersectionGenesData, isIntersectionElement, searchTerm, sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push(`/data/${section}?refresh=true`)} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Volver a datos de {info.title}
          </Button>
          <h1 className="text-3xl font-bold truncate">
            {element === "__TODOS_LOS_DATOS__" ? (
              <>Todos los genes de: <span className="text-blue-600 dark:text-blue-400">{info?.title}</span></>
            ) : (
              <>Genes con ruta: <span className="text-blue-600 dark:text-blue-400">{element}</span></>
            )}
          </h1>
        </div>

        <Card className="mb-8">
          <CardHeader className={`${info.color} rounded-t-lg`}>
            <div className="flex items-center gap-3">
              {info.icon && typeof info.icon === "function" ? info.icon() : null}
              <CardTitle>{info.title} - Genes filtrados por Pathway</CardTitle>
            </div>
            <CardDescription className="text-slate-700 dark:text-slate-300">
              {element === "__TODOS_LOS_DATOS__" ? (
                <>
                  Mostrando todos los genes de la tabla
                  <div className="mt-2 text-xs text-blue-500">
                    (Total de genes: {isIntersectionElement ? intersectionGenesData.length : genesData.length})
                  </div>
                </>
              ) : (
                <>
                  Mostrando genes que contienen la ruta "{element}" en su campo Pathway
                  <div className="mt-2 text-xs text-blue-500">
                    (Total de genes: {isIntersectionElement ? intersectionGenesData.length : genesData.length})
                  </div>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, KO_code o locustag..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Name">Nombre</SelectItem>
                      <SelectItem value="KO_code">KO Code</SelectItem>
                      <SelectItem value="Protein_accession">Protein Accession</SelectItem>
                      <SelectItem value="locustag">Locus Tag</SelectItem>
                      {isIntersectionElement ? (
                        <>
                          {/* Mostrar opciones de ordenamiento solo para las temperaturas de la intersección */}
                          {(mapSectionToTable(section) as string[])?.includes('16') && (
                            <SelectItem value="log2FoldChange_16">log2FoldChange 16°C</SelectItem>
                          )}
                          {(mapSectionToTable(section) as string[])?.includes('38') && (
                            <SelectItem value="log2FoldChange_38">log2FoldChange 38°C</SelectItem>
                          )}
                          {(mapSectionToTable(section) as string[])?.includes('41') && (
                            <SelectItem value="log2FoldChange_41">log2FoldChange 41°C</SelectItem>
                          )}
                        </>
                      ) : (
                        <SelectItem value="log2FoldChange">log2FoldChange</SelectItem>
                      )}
                      <SelectItem value="Pathway">Pathway</SelectItem>
                      <SelectItem value="Brite_protein_families_1">Brite Protein Families</SelectItem>
                      <SelectItem value="Brite_specific_family_1">Brite Specific Families</SelectItem>
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

            {loading ? (
              <div className="flex flex-col justify-center items-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-600 dark:text-slate-300 animate-pulse">
                  Cargando datos de la tabla {mapSectionToTable(section)}...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-4">
                  <h3 className="font-bold text-lg mb-2">Error al cargar datos</h3>
                  <p>{error}</p>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <Button variant="default" onClick={() => router.push("/")}>
                    Volver al diagrama
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Intentar de nuevo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Botón para recargar datos */}
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                  >
                    Recargar datos
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-700">
                        <th className="p-3 text-left text-sm font-medium">Name</th>
                        <th className="p-3 text-left text-sm font-medium">KO_code</th>
                        <th className="p-3 text-left text-sm font-medium">Protein_accession</th>
                        <th className="p-3 text-left text-sm font-medium">Locustag</th>
                        {isIntersectionElement ? (
                          <>
                            {/* Mostrar columnas solo para las temperaturas de la intersección */}
                            {getIntersectionTemperatures(section).includes('16') && (
                              <th className="p-3 text-left text-sm font-medium">log2FoldChange 16°C</th>
                            )}
                            {getIntersectionTemperatures(section).includes('38') && (
                              <th className="p-3 text-left text-sm font-medium">log2FoldChange 38°C</th>
                            )}
                            {getIntersectionTemperatures(section).includes('41') && (
                              <th className="p-3 text-left text-sm font-medium">log2FoldChange 41°C</th>
                            )}
                          </>
                        ) : (
                          <th className="p-3 text-left text-sm font-medium">log2FoldChange</th>
                        )}
                        <th className="p-3 text-left text-sm font-medium">Pathway</th>
                        <th className="p-3 text-left text-sm font-medium">Brite Protein Families</th>
                        <th className="p-3 text-left text-sm font-medium">Brite Specific Families</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedData.length > 0 ? (
                        // Mostrar los datos (hasta 100 elementos para evitar problemas de rendimiento)
                        filteredAndSortedData.slice(0, 100).map((gene, index) => (
                          <tr
                            key={`${(gene as any).id || (gene as any).ID || index}-${(gene as any).Name || 'gene'}`}
                            className={
                              index % 2 === 0 ? "bg-white/50 dark:bg-slate-800/50" : "bg-slate-50/50 dark:bg-slate-700/50"
                            }
                          >
                            <td className="p-3 text-sm font-medium">{(gene as any).Name || "-"}</td>
                            <td className="p-3 text-sm font-mono text-xs">
                              {(gene as any).KO_code ? (
                                <a 
                                  href={`https://www.kegg.jp/entry/${(gene as any).KO_code}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                                >
                                  {(gene as any).KO_code}
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-3 text-sm font-mono text-xs">{(gene as any).Protein_accession || "-"}</td>
                            <td className="p-3 text-sm">{(gene as any).locustag || (gene as any).Locustag || "-"}</td>
                            {isIntersectionElement ? (
                              <>
                                {/* Debug solo para el primer gene */}
                                {index === 0 && (() => {
                                  console.log('🧬 Gene intersección completo:', gene);
                                  console.log('🧬 Gene intersección debug:', {
                                    section,
                                    temperatures: getIntersectionTemperatures(section),
                                    allKeys: Object.keys(gene),
                                    log2FoldChange_16: (gene as any).log2FoldChange_16,
                                    log2FoldChange_38: (gene as any).log2FoldChange_38,
                                    log2FoldChange_41: (gene as any).log2FoldChange_41
                                  });
                                  return null;
                                })()}
                                
                                {/* Renderizar columnas de temperaturas específicas */}
                                {getIntersectionTemperatures(section).map(temp => (
                                  <td key={temp} className="p-3 text-sm font-mono">
                                    {(() => {
                                      const value = (gene as any)[`log2FoldChange_${temp}`];
                                      
                                      // Debug para la primera fila
                                      if (index === 0) {
                                        console.log(`🔥 Temp ${temp}:`, {
                                          fieldName: `log2FoldChange_${temp}`,
                                          value: value,
                                          valueType: typeof value,
                                          allGeneKeys: Object.keys(gene)
                                        });
                                      }
                                      
                                      // Usar la función helper para aplicar colores
                                      return renderLog2FoldChange(value);
                                    })()}
                                  </td>
                                ))}
                              </>
                            ) : (
                              <td className="p-3 text-sm font-mono">
                                {renderLog2FoldChange((gene as any).log2FoldChange)}
                              </td>
                            )}
                            
                            {/* Pathway column */}
                            <td className="p-3 text-sm">
                              {(gene as any).Pathway || (gene as any).Pathways || "-"}
                            </td>
                            
                            {/* Brite Protein Families column */}
                            <td className="p-3 text-sm">
                              <div className="space-y-1">
                                {(gene as any).Brite_protein_families_1 && (gene as any).Brite_protein_families_1 !== "-" && (
                                  <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                    {(gene as any).Brite_protein_families_1}
                                  </div>
                                )}
                                {(gene as any).Brite_protein_families_2 && (gene as any).Brite_protein_families_2 !== "-" && (
                                  <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                    {(gene as any).Brite_protein_families_2}
                                  </div>
                                )}
                                {(gene as any).Brite_protein_families_3 && (gene as any).Brite_protein_families_3 !== "-" && (
                                  <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                    {(gene as any).Brite_protein_families_3}
                                  </div>
                                )}
                                {(!(gene as any).Brite_protein_families_1 || (gene as any).Brite_protein_families_1 === "-") &&
                                 (!(gene as any).Brite_protein_families_2 || (gene as any).Brite_protein_families_2 === "-") &&
                                 (!(gene as any).Brite_protein_families_3 || (gene as any).Brite_protein_families_3 === "-") && (
                                  <span className="text-slate-500">−</span>
                                )}
                              </div>
                            </td>
                            
                            {/* Brite Specific Families column */}
                            <td className="p-3 text-sm">
                              <div className="space-y-1">
                                {(gene as any).Brite_specific_family_1 && (gene as any).Brite_specific_family_1 !== "-" && (
                                  <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                    {(gene as any).Brite_specific_family_1}
                                  </div>
                                )}
                                {(gene as any).Brite_specific_family_2 && (gene as any).Brite_specific_family_2 !== "-" && (
                                  <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                    {(gene as any).Brite_specific_family_2}
                                  </div>
                                )}
                                {(gene as any).Brite_specific_family_3 && (gene as any).Brite_specific_family_3 !== "-" && (
                                  <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                    {(gene as any).Brite_specific_family_3}
                                  </div>
                                )}
                                {(!(gene as any).Brite_specific_family_1 || (gene as any).Brite_specific_family_1 === "-") &&
                                 (!(gene as any).Brite_specific_family_2 || (gene as any).Brite_specific_family_2 === "-") &&
                                 (!(gene as any).Brite_specific_family_3 || (gene as any).Brite_specific_family_3 === "-") && (
                                  <span className="text-slate-500">−</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (isIntersectionElement ? intersectionGenesData.length : genesData.length) > 0 ? (
                        <tr>
                          <td colSpan={isIntersectionElement ? 
                            7 + getIntersectionTemperatures(section).length : 8} className="p-6 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Filter className="w-6 h-6 text-amber-500 mb-2" />
                              <p className="text-slate-600 dark:text-slate-300">
                                No se encontraron genes que coincidan con el término de búsqueda: <span className="font-medium">{searchTerm}</span>
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={() => setSearchTerm("")}
                              >
                                Limpiar filtro
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={isIntersectionElement ? 
                            7 + (mapSectionToTable(section) as string[])?.length : 8} className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                                <Database className="w-8 h-8 text-slate-400" />
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 font-medium">
                                No se encontraron genes para este pathway
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                                No hay genes en la tabla {mapSectionToTable(section)} que contengan el pathway "{element}"
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Mostrando {filteredAndSortedData.length} de {isIntersectionElement ? intersectionGenesData.length : genesData.length} genes
                </div>

                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar datos
                </Button>
              </div>
              
              {/* Se ha eliminado la sección de depuración */}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center items-center mb-8">
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Volver al diagrama
          </Button>
        </div>

        <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
          <p>Diagrama de Venn Interactivo © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
}