"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FlaskConical, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { listDatasets, uploadDataset, getDatasetStatus, type Dataset } from "@/lib/api-service"

const STATUS_POLL_MS = 3000

// "ready" = seeded pre-M2 (always viewable); "done" = upload finished. Both are terminal-ok states.
const VIEWABLE_STATUSES = ["ready", "done"]

function StatusBadge({ status }: { status: string }) {
  if (VIEWABLE_STATUSES.includes(status)) return null
  const styles: Record<string, string> = {
    pending: "text-amber-400 border-amber-500/30 bg-amber-500/10",
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

  const refresh = () => listDatasets().then(setDatasets).catch(() => setDatasets([]))

  useEffect(() => { refresh() }, [])

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload dataset</DialogTitle>
                <DialogDescription>
                  A raw counts matrix and sample metadata. DESeq2 runs in the background once uploaded.
                </DialogDescription>
              </DialogHeader>
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
            </DialogContent>
          </Dialog>
        </div>

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
