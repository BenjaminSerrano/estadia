import ElementDataClient from './element-data-client'
import { getTablePathways, getComparisonTablePathways, mapSectionToTable, mapSectionToComparisonTable } from '../../../../lib/api-service'

// Generar rutas estáticas para el export
export async function generateStaticParams() {
  const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
  const allParams: Array<{ section: string; element: string }> = []
  
  for (const section of sections) {
    // Agregar siempre la opción de todos los datos
    allParams.push({
      section: section,
      element: '__TODOS_LOS_DATOS__'
    })
    
    try {
      let pathways: string[] = []
      
      // Para secciones individuales (A, B, C)
      if (['A', 'B', 'C'].includes(section)) {
        const tableMapping = mapSectionToTable(section)
        if (typeof tableMapping === 'string') {
          const pathwaysData = await getTablePathways(tableMapping)
          pathways = pathwaysData.pathways || []
        }
      }
      // Para secciones de intersección (AB, AC, BC, ABC)
      else {
        const comparisonTable = mapSectionToComparisonTable(section)
        if (comparisonTable) {
          const pathwaysData = await getComparisonTablePathways(comparisonTable)
          pathways = pathwaysData.pathways || []
        }
      }
      
      // Convertir pathways a slugs URL y agregar a los parámetros
      for (const pathway of pathways) {
        const elementSlug = pathway.replace(/ /g, '-').toLowerCase()
        allParams.push({
          section: section,
          element: elementSlug
        })
      }
    } catch (error) {
      console.error(`Error al obtener pathways para sección ${section}:`, error)
      // En caso de error, continuar con otras secciones
    }
  }
  
  return allParams
}

export default function ElementDataPage() {
  return <ElementDataClient />
}