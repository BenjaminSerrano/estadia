import { redirect } from 'next/navigation'

// Generar rutas estáticas para el export
export async function generateStaticParams() {
  const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
  
  return sections.map((section) => ({
    section: section
  }))
}

// Esta página redirige automáticamente al diagrama de Venn
export default function RedirectToHome() {
  // Redirigir server-side
  redirect("/")
}