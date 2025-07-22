"use client"

// Generar rutas estáticas para el export
export async function generateStaticParams() {
  const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
  
  return sections.map((section) => ({
    section: section
  }))
}

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Esta página ya no se usa y redirige automáticamente al diagrama de Venn
export default function RedirectToHome() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir inmediatamente a la página principal
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-300">Redirigiendo al diagrama principal...</p>
      </div>
    </div>
  )
}