"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FlaskConical, Database, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { listDatasets, uploadDataset, getDatasetStatus, createJob, getJob, getJobsConfig, rememberJob, recentJobs, type Dataset, type Job } from "@/lib/api-service"

const STATUS_POLL_MS = 3000

// "ready" = seeded pre-M2 (always viewable); "done" = upload finished. Both are terminal-ok states.
const VIEWABLE_STATUSES = ["ready", "done"]

function StatusBadge({ status }: { status: string }) {
  if (VIEWABLE_STATUSES.includes(status)) return null
  const styles: Record<string, string> = {
    pending: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    queued: "text-slate-400 border-slate-500/30 bg-slate-500/10",
    "action needed": "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    running: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    error: "text-red-400 border-red-500/30 bg-red-500/10",
  }
  return (
    <span className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  )
}

export default function Home() {
  const [datasets, setDatasets] = useState<Dataset[] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [limits, setLimits] = useState<{ max_samples: number; max_gb: number } | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])

  const refresh = () => listDatasets().then(setDatasets).catch(() => setDatasets([]))

  useEffect(() => {
    refresh()
    getJobsConfig().then(setLimits).catch(() => {})
    // Jobs started from this browser that still need attention (finished ones already show up as datasets)
    Promise.all(recentJobs().map(j => getJob(j.token).catch(() => null)))
      .then(js => setJobs(js.filter((j): j is Job => !!j && !(j.status === "done" && j.dataset_status === "done"))))
  }, [])

  const handleReads = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const { token } = await createJob(formData)
      rememberJob(token, String(formData.get("name") ?? ""))
      router.push(`/job/?id=${token}`)
    } catch (err) {
      toast({ title: "Could not start the job", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
      setSubmitting(false)
    }
  }

  const pollUntilDone = (id: number) => {
    const poll = async () => {
      try {
        const { status, error } = await getDatasetStatus(id)
        if (status === "done") {
          toast({ title: "Dataset ready", description: "DESeq2 analysis complete." })
          refresh()
          router.push(`/dataset/?id=${id}`)
        } else if (status === "error") {
          toast({ title: "Analysis failed", description: error || "Unknown error", variant: "destructive" })
          setSubmitting(false)
          refresh()
        } else {
          toast({ title: "Processing…", description: `Status: ${status}` })
          setTimeout(poll, STATUS_POLL_MS)
        }
      } catch {
        setTimeout(poll, STATUS_POLL_MS)
      }
    }
    poll()
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const { dataset_id } = await uploadDataset(formData)
      toast({ title: "Upload received", description: "Running DESeq2 in the background…" })
      setDialogOpen(false)
      formRef.current?.reset()
      refresh()
      pollUntilDone(dataset_id)
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dot-grid transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-1 font-[family-name:var(--font-display)] text-foreground tracking-tight">
              DPDDS
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              RNA-seq datasets explored by set theory — pick one, or upload your own
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => router.push("/solver")} aria-label="Cobetia Solver">
              <FlaskConical className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" /> Datasets
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Upload className="h-4 w-4" /> Upload dataset</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload dataset</DialogTitle>
                <DialogDescription>
                  Start from the sequencer&apos;s raw reads, or from a counts table you already have.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="reads">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reads">From raw reads (links)</TabsTrigger>
                  <TabsTrigger value="counts">Counts table</TabsTrigger>
                </TabsList>
                <TabsContent value="reads">
              <form onSubmit={handleReads} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="r_name">Name</Label>
                  <Input id="r_name" name="name" required placeholder="e.g. S. aureus temperature shift" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r_genome">Reference genome (NCBI assembly)</Label>
                  <Input id="r_genome" name="genome_accession" required pattern="GC[AF]_\d{9}\.\d+" placeholder="e.g. GCF_000013465.1" />
                  <p className="text-xs text-muted-foreground">
                    Find it on <a className="underline" href="https://www.ncbi.nlm.nih.gov/datasets/genome/" target="_blank" rel="noopener noreferrer">NCBI Genome</a> by
                    species and strain. Bacteria only for now.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r_links">Links to the reads, one per line</Label>
                  <textarea
                    id="r_links" name="links" required rows={6}
                    placeholder={"https://…/sample1_R1.fastq.gz\nhttps://…/sample1_R2.fastq.gz\nhttps://…/all_samples.zip\nPRJNA759975"}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-[family-name:var(--font-mono)] text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                    <li>Direct download links to <span className="font-[family-name:var(--font-mono)]">.fastq.gz</span> files, a <span className="font-[family-name:var(--font-mono)]">.zip</span>/<span className="font-[family-name:var(--font-mono)]">.tar.gz</span> with all of them, or a web/FTP folder.</li>
                    <li>Shared Google Drive or Dropbox file links work. Portals that need a login (e.g. the sequencing company&apos;s site) don&apos;t — create a direct download link there.</li>
                    <li>Already on NCBI? Paste the BioProject (PRJNA…) or run accessions (SRR…).</li>
                    <li>You&apos;ll assign each sample&apos;s condition after the reads are counted.{limits && <> Up to {limits.max_samples} samples and {limits.max_gb} GB per job.</>}</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    <Link2 className="h-4 w-4" /> {submitting ? "Checking…" : "Process reads"}
                  </Button>
                </DialogFooter>
              </form>
                </TabsContent>
                <TabsContent value="counts">
              <p className="text-sm text-muted-foreground pt-2 pb-2">A raw counts matrix and sample metadata. DESeq2 runs in the background once uploaded.</p>
              <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Cobetia marina thermal stress" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organism">Organism</Label>
                  <Input id="organism" name="organism" placeholder="e.g. Cobetia marina" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genome_accession">NCBI genome assembly (optional)</Label>
                  <Input id="genome_accession" name="genome_accession" pattern="GC[AF]_\d{9}\.\d+" placeholder="e.g. GCF_000013465.1" />
                  <p className="text-xs text-muted-foreground">Fills gene names, KO codes and KEGG categories after the analysis. Locus tags in counts.csv must come from this assembly.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="baseline">Baseline condition</Label>
                  <Input id="baseline" name="baseline" required placeholder="must match a value in metadata.csv's condition column" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="counts">counts.csv</Label>
                  <Input id="counts" name="counts" type="file" accept=".csv" required />
                  <p className="text-xs text-muted-foreground">Rows = genes, columns = samples, values = raw integer counts.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="metadata">metadata.csv</Label>
                  <Input id="metadata" name="metadata" type="file" accept=".csv" required />
                  <p className="text-xs text-muted-foreground">Rows = samples (matching counts.csv columns), with a &quot;condition&quot; column.</p>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Uploading…" : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {jobs.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Your processing jobs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map(j => (
                <Card key={j.token} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/job/?id=${j.token}`)}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{j.name}</CardTitle>
                      <StatusBadge status={j.status === "needs_conditions" ? "action needed" : j.status === "done" ? "running" : j.status} />
                    </div>
                    {j.organism && <CardDescription className="italic">{j.organism}</CardDescription>}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {datasets === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-2xl bg-card">
            <p className="text-slate-500 dark:text-slate-400">No datasets yet — upload one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map(d => (
              <Card
                key={d.id}
                className={`shadow-lg transition-shadow ${VIEWABLE_STATUSES.includes(d.status) ? "cursor-pointer hover:shadow-xl" : "opacity-70"}`}
                onClick={() => { if (VIEWABLE_STATUSES.includes(d.status)) router.push(`/dataset/?id=${d.id}`) }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{d.name}</CardTitle>
                    <StatusBadge status={d.status} />
                  </div>
                  {d.organism && <CardDescription className="italic">{d.organism}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center pb-8">
          <p className="font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">Proyecto ANID Exploración 13220184</p>
        </footer>
      </div>
    </div>
  )
}
