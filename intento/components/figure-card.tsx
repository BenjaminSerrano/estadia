"use client"

import { useRef, type ReactNode } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadPng, downloadSvg } from "@/lib/export-figure"

// A publication figure on a white sheet (what you see is what gets exported) with SVG/PNG downloads
export default function FigureCard({ title, name, children }: { title: string; name: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const svg = () => ref.current?.querySelector("svg") ?? null

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/60">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-muted-foreground mr-auto">{title}</span>
        {(["svg", "png"] as const).map(fmt => (
          <Button key={fmt} variant="outline" size="sm" className="h-7 gap-1.5 font-[family-name:var(--font-mono)] text-xs"
            onClick={() => { const s = svg(); if (s) fmt === "svg" ? downloadSvg(s, name) : downloadPng(s, name) }}>
            <Download className="h-3 w-3" />
            {fmt.toUpperCase()}
          </Button>
        ))}
      </div>
      <div ref={ref} className="bg-white p-4">{children}</div>
    </div>
  )
}
