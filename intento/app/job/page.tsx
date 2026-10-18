"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowRight, Check, Copy, Database, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { getJob, jobCountsUrl, rememberJob, setJobConditions, type Job, type JobSample } from "@/lib/api-service"

const POLL_MS = 4000

// Job page: /job/?id=<token>. Query param (not a route segment) because the frontend is a static export.
export default function JobPage() {
  return (
    <Suspense fallback={null}>
      <JobView />
    </Suspense>
  )
}

const STATE_STYLES: Record<string, string> = {
  queued: "text-slate-400 border-slate-500/30 bg-slate-500/10",
  downloading: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  qc: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  counting: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  done: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  error: "text-red-400 border-red-500/30 bg-red-500/10",
}
const STATE_LABELS: Record<string, string> = {
  queued: "queued", downloading: "downloading", qc: "quality check", counting: "counting", done: "counted", error: "failed",
}

function StateBadge({ state }: { state: string }) {
  return (
    <span className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border whitespace-nowrap ${STATE_STYLES[state] ?? STATE_STYLES.queued}`}>
      {STATE_LABELS[state] ?? state}
    </span>
  )
}

// Prefill only (the user checks it): drop a trailing replicate marker — "AH1263_34_A" -> "AH1263_34", "ctrlB" -> "ctrl", "WT_rep2" -> "WT"
function suggestCondition(name: string) {
  const s = name.replace(/[_\-. ](rep|replicate|r)?[_\-. ]?\d+$/i, "").replace(/[_\-. ][A-Za-z]$/, "").replace(/(?<=[a-z])[A-Z]$/, "")
  return s || name
}

const fmtReads = (n?: number) => (n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : `${Math.round(n / 1e3)} k`)

function JobView() {
  const router = useRouter()
  const token = useSearchParams().get("id") ?? ""
  const { toast } = useToast()
  const [job, setJob] = useState<Job | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [conditions, setConditions] = useState<Record<string, string>>({})
  const [baseline, setBaseline] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) router.replace("/")
  }, [token, router])

  // Poll while something is still moving: the job itself, or the DESeq2 run it created
  useEffect(() => {
    if (!token) return
    let timer: ReturnType<typeof setTimeout>
    let stopped = false
    const poll = async () => {
      try {
        const j = await getJob(token)
        if (stopped) return
        setJob(j)
        setLoadError(null)
        rememberJob(token, j.name)
        const moving = j.status === "queued" || j.status === "running" ||
          (j.status === "done" && !["done", "error"].includes(j.dataset_status ?? ""))
        if (moving) timer = setTimeout(poll, POLL_MS)
      } catch (e) {
        if (stopped) return
        setLoadError(e instanceof Error ? e.message : "Could not load the job")
        timer = setTimeout(poll, POLL_MS * 2)
      }
    }
    poll()
    return () => { stopped = true; clearTimeout(timer) }
  }, [token, submitting])

  const samples: JobSample[] = job?.progress?.samples ?? []
  const counted = samples.filter(s => s.state === "done")

  // Prefill conditions once, when the counts are ready
  useEffect(() => {
    if (job?.status !== "needs_conditions" || Object.keys(conditions).length) return
    setConditions(Object.fromEntries(counted.map(s => [s.name, suggestCondition(s.name)])))
  }, [job?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const g: Record<string, number> = {}
    for (const c of Object.values(conditions)) if (c.trim()) g[c.trim()] = (g[c.trim()] ?? 0) + 1
    return g
  }, [conditions])
  const labels = Object.keys(groups).sort()
  const problems = [
    ...labels.filter(l => groups[l] < 2).map(l => `"${l}" has only ${groups[l]} sample — each condition needs at least 2 replicates`),
    ...(labels.length < 2 ? ["Assign at least two conditions: the control and one to compare"] : []),
    ...(!baseline || !groups[baseline] ? ["Choose which condition is the control"] : []),
  ]

  const submit = async () => {
    setSubmitting(true)
    try {
      await setJobConditions(token, baseline, conditions)
      toast({ title: "Analysis started", description: "Running DESeq2 and gene annotation…" })
    } catch (e) {
      toast({ title: "Could not start the analysis", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked: the URL is visible in the address bar */ }
  }

  const assigning = job?.status === "needs_conditions"

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background dot-grid transition-colors duration-300">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="text-center md:text-left">
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-muted-foreground mb-1">Processing raw reads</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 font-[family-name:var(--font-display)] text-foreground tracking-tight">
                {job?.name ?? (loadError ? "Job not found" : "Loading job…")}
              </h1>
              {job && (
                <p className="text-base text-slate-500 dark:text-slate-400">
                  <span className="italic">{job.organism}</span>
                  <span className="font-[family-name:var(--font-mono)] text-xs ml-2">{job.genome_accession}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => router.push("/")} aria-label="Back to datasets">
                    <Database className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Back to datasets</p></TooltipContent>
              </Tooltip>
              <ThemeToggle />
            </div>
          </header>

          {loadError && !job && (
            <Card className="mb-6"><CardContent className="pt-6 text-sm text-red-500">{loadError}</CardContent></Card>
          )}

          {job && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
                <span>Keep this page&apos;s link to come back to the job — there are no accounts.</span>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 font-[family-name:var(--font-mono)] text-xs" onClick={copyLink}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy link"}
                </Button>
                {(job.status === "needs_conditions" || job.status === "done") && (
                  <Button asChild variant="outline" size="sm" className="h-7 gap-1.5 font-[family-name:var(--font-mono)] text-xs">
                    <a href={jobCountsUrl(token)} download><Download className="h-3 w-3" /> Download counts (CSV)</a>
                  </Button>
                )}
              </div>

              <StatusCard job={job} countedCount={counted.length} total={samples.length} onOpen={() => router.push(`/dataset/?id=${job.dataset_id}`)} />

              {assigning && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Assign a condition to each sample</CardTitle>
                    <CardDescription>
                      Conditions are pre-filled from the sample names — check them. Use the same label for replicates
                      (e.g. <span className="font-[family-name:var(--font-mono)]">37</span>) and leave a sample blank to leave it out.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="space-y-1.5 min-w-[14rem]">
                        <Label>Control condition</Label>
                        <Select value={baseline} onValueChange={setBaseline}>
                          <SelectTrigger><SelectValue placeholder="— choose the control —" /></SelectTrigger>
                          <SelectContent>
                            {labels.length ? labels.map(l => <SelectItem key={l} value={l}>{l} ({groups[l]} samples)</SelectItem>)
                              : <SelectItem value="none" disabled>Type the conditions first</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={submit} disabled={submitting || problems.length > 0} className="gap-2">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        Run differential expression
                      </Button>
                    </div>
                    {problems.length > 0 && (
                      <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                        {problems.map(m => <li key={m}>· {m}</li>)}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {samples.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Samples</CardTitle>
                    <CardDescription>Detected from the file names (R1/R2 pairs and Illumina lanes are merged) or from NCBI.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border">
                          <th className="py-2 pr-3 font-medium">Sample</th>
                          {assigning && <th className="py-2 pr-3 font-medium">Condition</th>}
                          <th className="py-2 pr-3 font-medium">Status</th>
                          <th className="py-2 pr-3 font-medium text-right">Reads</th>
                          <th className="py-2 pr-3 font-medium text-right">Q30</th>
                          <th className="py-2 pr-3 font-medium text-right">Assigned to genes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {samples.map(s => (
                          <tr key={s.name} className="border-b border-border/60 align-top">
                            <td className="py-2 pr-3">
                              <div className="font-[family-name:var(--font-mono)] text-xs text-foreground">{s.name}</div>
                              <div className="text-[11px] text-muted-foreground break-all">
                                {s.source && s.source !== "file" ? s.source : (s.files ?? []).join(", ")}
                                {s.layout && <> · {s.layout}</>}
                              </div>
                              {(s.error || s.warning) && (
                                <div className={`text-[11px] mt-0.5 flex gap-1 ${s.error ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`}>
                                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {s.error || s.warning}
                                </div>
                              )}
                            </td>
                            {assigning && (
                              <td className="py-2 pr-3">
                                {s.state === "done" ? (
                                  <Input
                                    value={conditions[s.name] ?? ""}
                                    onChange={e => setConditions(c => ({ ...c, [s.name]: e.target.value }))}
                                    placeholder="leave out"
                                    aria-label={`Condition for ${s.name}`}
                                    className="h-8 w-36 font-[family-name:var(--font-mono)] text-xs"
                                  />
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </td>
                            )}
                            <td className="py-2 pr-3"><StateBadge state={s.state} /></td>
                            <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">{fmtReads(s.reads)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">{s.q30 == null ? "—" : `${s.q30} %`}</td>
                            <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">{s.mapped == null ? "—" : `${s.mapped} %`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              <details className="mt-6 text-sm text-muted-foreground">
                <summary className="cursor-pointer">Submitted links ({job.links.length})</summary>
                <ul className="mt-2 font-[family-name:var(--font-mono)] text-xs space-y-0.5 break-all">
                  {job.links.map(l => <li key={l}>{l}</li>)}
                </ul>
              </details>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

function StatusCard({ job, countedCount, total, onOpen }: { job: Job; countedCount: number; total: number; onOpen: () => void }) {
  const p = job.progress
  let title = "", body: React.ReactNode = null, tone = "border-border", spinning = false
  if (job.status === "queued") {
    title = "Waiting in the queue"
    body = job.queue_position ? `${job.queue_position} job${job.queue_position > 1 ? "s" : ""} ahead. Jobs run one at a time.` : "Starting soon."
    spinning = true
  } else if (job.status === "running") {
    title = p?.message || "Processing"
    body = (
      <>
        {total > 0 && <span>{countedCount} of {total} samples counted. </span>}
        {p && p.downloaded_gb > 0 && <span>{p.downloaded_gb.toFixed(2)} GB downloaded. </span>}
        Raw reads are deleted as soon as each sample is counted. You can close this page and come back.
      </>
    )
    spinning = true
  } else if (job.status === "needs_conditions") {
    title = "Reads counted"
    body = `${countedCount} of ${total} samples were counted. Assign their conditions below to run the differential expression analysis.`
    tone = "border-emerald-500/40"
  } else if (job.status === "error") {
    title = "Processing failed"
    body = job.error
    tone = "border-red-500/50"
  } else if (job.status === "done") {
    if (job.dataset_status === "done") {
      title = "Results ready"
      body = <Button onClick={onOpen} className="gap-2 mt-1">Open the Venn diagram <ArrowRight className="h-4 w-4" /></Button>
      tone = "border-emerald-500/40"
    } else if (job.dataset_status === "error") {
      title = "The analysis failed"
      body = "DESeq2 could not run on these samples. Open the datasets list for details."
      tone = "border-red-500/50"
    } else {
      title = "Running DESeq2 and gene annotation"
      body = "This usually takes one or two minutes."
      spinning = true
    }
  }
  return (
    <Card className={`mb-6 ${tone}`}>
      <CardContent className="pt-6 flex gap-3">
        {spinning ? <Loader2 className="h-5 w-5 animate-spin text-sky-500 shrink-0 mt-0.5" />
          : job.status === "error" || job.dataset_status === "error" ? <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          : <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{title}</p>
          <div className="text-sm text-muted-foreground">{body}</div>
        </div>
      </CardContent>
    </Card>
  )
}
