"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, ExternalLink } from "lucide-react"

export default function SolverPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/60 rounded px-2.5 py-1.5 hover:bg-muted"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Diagram
        </button>

        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-muted-foreground">
            Cobetia Solver
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>

        <a
          href="/solver.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/60 rounded px-2.5 py-1.5 hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open standalone
        </a>
      </div>

      {/* ── Iframe ── */}
      <iframe
        src="/solver.html"
        className="flex-1 w-full border-0"
        style={{ minHeight: "calc(100vh - 45px)" }}
        title="Cobetia Solver — Metaheurística Bioinspirada"
        allow="scripts"
      />
    </div>
  )
}
