import { Circle, CheckCircle } from "lucide-react"
import type { Condition } from "./api-service"

// Given ordered conditions [c0, c1, c2], map Venn section → include/exclude condition IDs.
// Section letters A/B/C map to conditions by position (0/1/2).
export function sectionToConditions(
  section: string,
  conditions: Condition[]
): { include: number[]; exclude: number[] } {
  if (!conditions.length) return { include: [], exclude: [] }
  const ids = conditions.map(c => c.id)
  const letterIdx: Record<string, number> = { A: 0, B: 1, C: 2 }
  const included = section.split('').map(l => ids[letterIdx[l]]).filter((x): x is number => x !== undefined)
  const excluded = ids.filter(id => !included.includes(id))
  return { include: included, exclude: excluded }
}

export function isIntersection(section: string) {
  return section.length > 1
}

export function getSectionInfo(section: string, conditions: Condition[] = []) {
  const lbl = (i: number) => conditions[i]?.label ?? '?'
  const idx = section.split('').map(l => 'ABC'.indexOf(l))
  const inside = idx.map(lbl)
  // Conditions not in this section (works for 1, 2 or 3 comparisons)
  const outside = conditions.map((_, i) => i).filter(i => !idx.includes(i)).map(lbl)
  const title = section.length === 1 ? `Genes at ${inside[0]}`
    : section.length === 3 ? 'Common genes at all conditions'
    : `Common genes: ${inside.join(' and ')}`
  const description = `Genes differentially expressed at ${inside.join(' and ')}` +
    (outside.length ? `, but not at ${outside.join(' or ')}.` : '.')

  const styles: Record<string, { color: string; accentColor: string; icon: any }> = {
    A:   { color: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",     accentColor: "text-purple-600 dark:text-purple-400",   icon: Circle },
    B:   { color: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",             accentColor: "text-blue-600 dark:text-blue-400",       icon: Circle },
    C:   { color: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30",             accentColor: "text-pink-600 dark:text-pink-400",       icon: Circle },
    AB:  { color: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30",     accentColor: "text-indigo-600 dark:text-indigo-400",   icon: CheckCircle },
    AC:  { color: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/30 dark:to-fuchsia-800/30", accentColor: "text-fuchsia-600 dark:text-fuchsia-400", icon: CheckCircle },
    BC:  { color: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30",     accentColor: "text-violet-600 dark:text-violet-400",   icon: CheckCircle },
    ABC: { color: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",         accentColor: "text-slate-700 dark:text-slate-300",     icon: CheckCircle },
  }
  return styles[section] ? { title, description, ...styles[section] } : null
}
