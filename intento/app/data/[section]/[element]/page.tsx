import ElementDataClient from './element-data-client'

// Generar rutas estáticas para el export
export async function generateStaticParams() {
  const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
  const elements = ['__TODOS_LOS_DATOS__']
  
  return sections.flatMap((section) =>
    elements.map((element) => ({
      section: section,
      element: element
    }))
  )
}

export default function ElementDataPage() {
  return <ElementDataClient />
}