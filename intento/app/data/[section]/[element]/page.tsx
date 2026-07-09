import ElementDataClient from './element-data-client'
import { getConditions, getPathways } from '../../../../lib/api-service'
import { sectionToConditions } from '../../../../lib/section-data'

export async function generateStaticParams() {
  const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
  const allParams: Array<{ section: string; element: string }> = []

  try {
    const conditions = await getConditions(1)

    for (const section of sections) {
      allParams.push({ section, element: '__TODOS_LOS_DATOS__' })

      const { include, exclude } = sectionToConditions(section, conditions)
      const { pathways } = await getPathways(1, include, exclude)

      for (const pathway of pathways) {
        allParams.push({ section, element: pathway.replace(/ /g, '-').toLowerCase() })
      }
    }
  } catch (error) {
    console.error('Error generating static params:', error)
    // Fallback: at minimum guarantee the "all data" routes exist
    const sections2 = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
    for (const section of sections2) {
      allParams.push({ section, element: '__TODOS_LOS_DATOS__' })
    }
  }

  return allParams
}

export default function ElementDataPage() {
  return <ElementDataClient />
}
