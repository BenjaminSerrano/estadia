import { redirect } from 'next/navigation'

// Generate static routes for export
export async function generateStaticParams() {
  const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']

  return sections.map((section) => ({
    section: section
  }))
}

// This page automatically redirects to the Venn diagram
export default function RedirectToHome() {
  // Server-side redirect
  redirect("/")
}