const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://estadia-production.up.railway.app'

export interface Condition {
  id: number
  label: string
  is_baseline: boolean
}

export interface Gene {
  id: number
  locustag: string
  KO_code: string
  Protein_accession: string
  Name: string
  Pathway: string
  Brite_specific_family_1: string
  Brite_specific_family_2: string
  Brite_specific_family_3: string
  Brite_protein_families_1: string
  Brite_protein_families_2: string
  Brite_protein_families_3: string
  expression: Record<string, { log2FoldChange: number | null; pvalue: number | null; padj: number | null }>
}

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

function condParams(include: number[], exclude: number[]): string {
  const p = new URLSearchParams({ include_conditions: include.join(',') })
  if (exclude.length) p.set('exclude_conditions', exclude.join(','))
  return p.toString()
}

export const getConditions = (datasetId = 1) =>
  apiFetch<Condition[]>(`/datasets/${datasetId}/conditions`)

export const getStats = (datasetId: number, include: number[], exclude: number[]) =>
  apiFetch<{ total_genes: number; unique_pathways: number; pathways_list: string[] }>(
    `/datasets/${datasetId}/stats?${condParams(include, exclude)}`
  )

export const getPathways = (datasetId: number, include: number[], exclude: number[]) =>
  apiFetch<{ pathways: string[] }>(
    `/datasets/${datasetId}/pathways?${condParams(include, exclude)}`
  )

export const getGenes = (
  datasetId: number,
  include: number[],
  exclude: number[],
  pathway = '',
  skip = 0,
  limit = 1000
) => {
  const p = new URLSearchParams({
    include_conditions: include.join(','),
    skip: String(skip),
    limit: String(limit),
  })
  if (exclude.length) p.set('exclude_conditions', exclude.join(','))
  if (pathway && pathway !== '__TODOS_LOS_DATOS__') p.set('pathway', pathway)
  return apiFetch<{ genes: Gene[]; total: number }>(`/datasets/${datasetId}/genes?${p}`)
}
