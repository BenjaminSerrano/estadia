const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://estadia-production.up.railway.app'

export interface Condition {
  id: number
  label: string
  is_baseline: boolean
}

export interface Dataset {
  id: number
  name: string
  organism: string
  status: string
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

// Venn sets by direction: "" = any DEG, "up"/"down" = only up- or downregulated DEGs
export type Direction = "" | "up" | "down"

// Every gene with log2FC/padj per comparison vs the control (arrays follow `comparisons`)
export interface ResultGene {
  locustag: string
  name: string | null
  ko: string | null
  log2fc: (number | null)[]
  padj: (number | null)[]
}

export interface Results {
  control: string | null
  thresholds: { padj: number; log2fc: number }
  comparisons: { id: number; label: string }[]
  genes: ResultGene[]
}

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

function condParams(include: number[], exclude: number[], direction: Direction = ''): string {
  const p = new URLSearchParams({ include_conditions: include.join(',') })
  if (exclude.length) p.set('exclude_conditions', exclude.join(','))
  if (direction) p.set('direction', direction)
  return p.toString()
}

export const getConditions = (datasetId = 1) =>
  apiFetch<Condition[]>(`/datasets/${datasetId}/conditions`)

export const getStats = (datasetId: number, include: number[], exclude: number[], direction: Direction = '') =>
  apiFetch<{ total_genes: number; unique_pathways: number; pathways_list: string[] }>(
    `/datasets/${datasetId}/stats?${condParams(include, exclude, direction)}`
  )

export const getPathways = (datasetId: number, include: number[], exclude: number[], direction: Direction = '') =>
  apiFetch<{ pathways: string[] }>(
    `/datasets/${datasetId}/pathways?${condParams(include, exclude, direction)}`
  )

export const getResults = (datasetId: number) => apiFetch<Results>(`/datasets/${datasetId}/results`)

export const listDatasets = () => apiFetch<Dataset[]>('/datasets')

export const uploadDataset = async (formData: FormData): Promise<{ dataset_id: number; status: string }> => {
  const r = await fetch(`${API_BASE}/datasets`, { method: 'POST', body: formData })
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail || `${r.status} ${r.statusText}`)
  return r.json()
}

export const getDatasetStatus = (datasetId: number) =>
  apiFetch<{ status: string; error: string | null }>(`/datasets/${datasetId}/status`)

export const getGenes = (
  datasetId: number,
  include: number[],
  exclude: number[],
  pathway = '',
  skip = 0,
  limit = 1000,
  direction: Direction = ''
) => {
  const p = new URLSearchParams({
    include_conditions: include.join(','),
    skip: String(skip),
    limit: String(limit),
  })
  if (exclude.length) p.set('exclude_conditions', exclude.join(','))
  if (direction) p.set('direction', direction)
  if (pathway && pathway !== '__TODOS_LOS_DATOS__') p.set('pathway', pathway)
  return apiFetch<{ genes: Gene[]; total: number }>(`/datasets/${datasetId}/genes?${p}`)
}

// ── Jobs from raw reads (links or NCBI accessions) ───────────────────────────
// queued -> running -> needs_conditions -> done, or error. The token is the only
// handle to a job (the API has no accounts), so the job page lives at /job/?id=<token>.

export interface JobSample {
  name: string
  source?: string
  files?: string[]
  state: string // queued | downloading | qc | counting | done | error
  layout?: string
  reads?: number
  q30?: number
  passed?: number
  mapped?: number
  warning?: string
  error?: string
}

export interface Job {
  token: string
  name: string
  organism: string | null
  genome_accession: string
  links: string[]
  status: "queued" | "running" | "needs_conditions" | "done" | "error"
  error: string | null
  progress: { stage: string; message: string; samples: JobSample[]; downloaded_gb: number; warnings: string[] } | null
  created_at: string | null
  dataset_id: number | null
  dataset_status: string | null
  queue_position: number | null
}

async function apiSend<T>(path: string, init: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, init)
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail || `${r.status} ${r.statusText}`)
  return r.json()
}

export const getJobsConfig = () => apiFetch<{ max_samples: number; max_gb: number }>('/jobs/config')

export const createJob = (formData: FormData) =>
  apiSend<{ token: string; status: string; organism: string }>('/jobs', { method: 'POST', body: formData })

export const getJob = (token: string) => apiFetch<Job>(`/jobs/${encodeURIComponent(token)}`)

export const jobCountsUrl = (token: string) => `${API_BASE}/jobs/${encodeURIComponent(token)}/counts.csv`

export const setJobConditions = (token: string, baseline: string, conditions: Record<string, string>) =>
  apiSend<{ dataset_id: number; status: string }>(`/jobs/${encodeURIComponent(token)}/conditions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseline, conditions }),
  })

// Jobs started from this browser, so the home page can list them (per-viewer convenience only)
const JOBS_KEY = 'dpdds_jobs'

export function rememberJob(token: string, name: string) {
  try {
    const jobs = recentJobs().filter(j => j.token !== token)
    localStorage.setItem(JOBS_KEY, JSON.stringify([{ token, name }, ...jobs].slice(0, 20)))
  } catch { /* storage unavailable: the job link still works */ }
}

export function recentJobs(): { token: string; name: string }[] {
  try {
    return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]')
  } catch {
    return []
  }
}
