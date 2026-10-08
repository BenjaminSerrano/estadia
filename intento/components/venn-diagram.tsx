"use client"

import { Fragment, useState, useEffect, useRef } from "react"

interface VennDiagramProps {
  onSectionClick: (section: string) => void | Promise<void>
  selectedSection: string | null
  labels: string[] // one per circle (A, B, C), in order
}

// ─── Geometry ────────────────────────────────────────────────────────────────
// Circle centres and outside-label positions for 1, 2 or 3 comparisons vs the control
type Letter = "A" | "B" | "C"
const LAYOUT: Record<1 | 2 | 3, { c: Partial<Record<Letter, [number, number]>>; t: Partial<Record<Letter, [number, number]>> }> = {
  1: { c: { A: [220, 160] },                         t: { A: [220, 66] } },
  2: { c: { A: [160, 160], B: [280, 160] },             t: { A: [90, 98], B: [350, 98] } },
  3: { c: { A: [160, 140], B: [280, 140], C: [220, 220] }, t: { A: [90, 88], B: [350, 88], C: [220, 315] } },
}
const R  = 80
const VW = 440
const VH = 320

// ─── Temperature-semantic palette ────────────────────────────────────────────
const PALETTE = {
  A:   { base: "rgba(14,165,233,0.28)",  hover: "rgba(14,165,233,0.55)",  active: "rgba(14,165,233,0.80)",  ring: "rgb(14,165,233)" },
  B:   { base: "rgba(245,158,11,0.28)", hover: "rgba(245,158,11,0.55)", active: "rgba(245,158,11,0.80)", ring: "rgb(245,158,11)" },
  C:   { base: "rgba(239,68,68,0.28)",  hover: "rgba(239,68,68,0.55)",  active: "rgba(239,68,68,0.80)",  ring: "rgb(239,68,68)" },
  AB:  { base: "rgba(20,184,166,0.38)", hover: "rgba(20,184,166,0.62)", active: "rgba(20,184,166,0.85)", ring: "rgb(20,184,166)" },
  AC:  { base: "rgba(168,85,247,0.38)", hover: "rgba(168,85,247,0.62)", active: "rgba(168,85,247,0.85)", ring: "rgb(168,85,247)" },
  BC:  { base: "rgba(249,115,22,0.38)", hover: "rgba(249,115,22,0.62)", active: "rgba(249,115,22,0.85)", ring: "rgb(249,115,22)" },
  ABC: { base: "rgba(255,255,255,0.45)",hover: "rgba(255,255,255,0.70)",active: "rgba(255,255,255,0.90)",ring: "rgb(255,255,255)" },
} as const

type SectionId = keyof typeof PALETTE

// Numeric labels are temperatures ("16" -> "16°C"); anything else is shown as-is
const fmt = (l: string) => /^\d+(\.\d+)?$/.test(l) ? `${l}°C` : l

const SECTIONS: SectionId[] = ["A", "B", "C", "AB", "AC", "BC", "ABC"]

// Which circles border each region (for ring highlighting)
const BORDERS: Record<SectionId, Letter[]> = {
  A: ["A"], B: ["B"], C: ["C"],
  AB: ["A", "B"], AC: ["A", "C"], BC: ["B", "C"], ABC: ["A", "B", "C"],
}

export default function VennDiagram({ onSectionClick, selectedSection, labels }: VennDiagramProps) {
  const [a, b, c] = labels.map(fmt)
  const n = Math.min(Math.max(labels.length, 1), 3) as 1 | 2 | 3
  const L = LAYOUT[n]
  const letters = (["A", "B", "C"] as Letter[]).slice(0, n)
  // Only regions made of circles that exist (e.g. A, B, AB for two comparisons)
  const visible = SECTIONS.filter(id => BORDERS[id].every(l => letters.includes(l)))
  const TEXT: Record<SectionId, { label: string; desc: string }> = {
    A:   { label: a,               desc: `Genes expressed at ${a}` },
    B:   { label: b,               desc: `Genes expressed at ${b}` },
    C:   { label: c,               desc: `Genes expressed at ${c}` },
    AB:  { label: `${a} ∩ ${b}`,   desc: `Common genes: ${a} & ${b}` },
    AC:  { label: `${a} ∩ ${c}`,   desc: `Common genes: ${a} & ${c}` },
    BC:  { label: `${b} ∩ ${c}`,   desc: `Common genes: ${b} & ${c}` },
    ABC: { label: "All conditions", desc: "Common genes across all conditions" },
  }
  const [hovered, setHovered] = useState<SectionId | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // ─── Color helpers ─────────────────────────────────────────────────────────
  const fill = (id: SectionId) => {
    const p = PALETTE[id]
    if (selectedSection === id) return p.active
    if (hovered === id)         return p.hover
    return p.base
  }

  const ringOpacity = (letter: Letter) => {
    const sid = selectedSection as SectionId | null
    const hid = hovered
    const active = sid ?? hid
    if (!active) return "0.35"
    const borders = BORDERS[active] ?? []
    return borders.includes(letter) ? "1" : "0.25"
  }

  const ringWidth = (letter: Letter) => {
    const active = (selectedSection ?? hovered) as SectionId | null
    if (!active) return "1.5"
    return (BORDERS[active] ?? []).includes(letter) ? "2.5" : "1"
  }

  // ─── Region props (shared across all 7 clickable rects) ───────────────────
  const rp = (id: SectionId) => ({
    x: 0, y: 0, width: VW, height: VH,
    fill: fill(id),
    style: { transition: "fill 0.2s ease", cursor: "pointer" },
    onClick:      () => onSectionClick(id),
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
    role: "button" as const,
    "aria-label": TEXT[id].desc,
    "aria-pressed": selectedSection === id,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") onSectionClick(id) },
  })

  // ─── Keyboard escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHovered(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const tooltip = hovered ? { ring: PALETTE[hovered].ring, label: TEXT[hovered].label } : null

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Interactive Venn diagram — ${n} condition${n > 1 ? "s" : ""} vs control`}
      >
        <title>Interactive Venn diagram of genes expressed at different temperatures</title>

        <defs>
          {/* ── Clip paths, one per circle ── */}
          {letters.map(l => (
            <clipPath key={l} id={`cp-${l}`}>
              <circle cx={L.c[l]![0]} cy={L.c[l]![1]} r={R} />
            </clipPath>
          ))}

          {/* ── Glow filter ── */}
          <filter id="venn-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Soft inner shadow ── */}
          <filter id="venn-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — decorative circle rings (non-interactive, behind fills)
        ═══════════════════════════════════════════════════════════════════ */}
        {letters.map((letter) => (
          <circle
            key={letter}
            cx={L.c[letter]![0]} cy={L.c[letter]![1]} r={R}
            fill="none"
            stroke={PALETTE[letter].ring}
            strokeWidth={ringWidth(letter)}
            strokeOpacity={ringOpacity(letter)}
            style={{ transition: "stroke-opacity 0.25s, stroke-width 0.25s" }}
            pointerEvents="none"
          />
        ))}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — 7 independent clickable regions via clipPath nesting.
            Z-order: single sets → pairwise → triple (topmost wins click).
            Each region is a <rect> that fills the SVG, clipped to the
            intersection of its constituent circles only.
        ═══════════════════════════════════════════════════════════════════ */}

        {/* Singles first, then pairs, then the triple: the topmost region wins the click.
            Each region is a full-size <rect> nested inside the clip of every circle it belongs to. */}
        {visible.map(id => (
          <Fragment key={id}>
            {BORDERS[id].reduceRight<React.ReactNode>(
              (inner, l) => <g clipPath={`url(#cp-${l})`}>{inner}</g>,
              <rect {...rp(id)} />,
            )}
          </Fragment>
        ))}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 — temperature labels (outside circles, non-interactive)
        ═══════════════════════════════════════════════════════════════════ */}
        {letters.map((l, i) => (
          <text
            key={l}
            x={L.t[l]![0]} y={L.t[l]![1]}
            fill={PALETTE[l].ring} fontSize="15" fontWeight="700"
            textAnchor="middle" fontFamily="var(--font-mono), monospace"
            pointerEvents="none"
            opacity={hovered && !BORDERS[hovered].includes(l) && selectedSection && !BORDERS[selectedSection as SectionId]?.includes(l) ? "0.4" : "1"}
            style={{ transition: "opacity 0.2s" }}
          >{[a, b, c][i]}</text>
        ))}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 4 — hover tooltip
        ═══════════════════════════════════════════════════════════════════ */}
        {tooltip && (
          <g style={{ animation: "fadeIn 0.15s ease-out" }}>
            <rect
              x="298" y="18" width="132" height="52"
              rx="8" ry="8"
              fill="rgba(10,15,30,0.92)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
            <text
              x="364" y="38"
              fill={tooltip.ring} fontSize="12" fontWeight="700"
              textAnchor="middle" fontFamily="var(--font-mono), monospace"
            >{tooltip.label}</text>
            <text
              x="364" y="56"
              fill="rgba(255,255,255,0.55)" fontSize="9"
              textAnchor="middle" fontFamily="var(--font-display, system-ui), sans-serif"
            >Click to explore</text>
          </g>
        )}

      </svg>

      {/* ════════════════════════════════════════════════════════════════════
          Section legend buttons (accessibility + quick selection)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-8 grid grid-cols-4 gap-2">
        {visible.map((id) => {
          const p = PALETTE[id]
          const isActive = selectedSection === id
          const isHov    = hovered === id
          return (
            <button
              key={id}
              onClick={() => onSectionClick(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={isActive}
              className={`relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-200 border ${
                isActive
                  ? "border-white/20 bg-white/8 shadow-md"
                  : isHov
                    ? "border-white/15 bg-white/5"
                    : "border-border bg-muted"
              }`}
            >
              {/* color swatch */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: p.ring,
                  boxShadow: (isActive || isHov) ? `0 0 8px 2px ${p.ring}55` : "none",
                }}
              />
              {/* label */}
              <span className="font-[family-name:var(--font-mono)] text-[10px] font-medium leading-tight text-foreground/80 truncate">
                {TEXT[id].label}
              </span>
              {/* active indicator */}
              {isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>

      {/* sr-only description */}
      <p className="sr-only">
        Interactive Venn diagram with {visible.length} clickable regions: {visible.map(id => TEXT[id].label).join(", ")}. Use Tab to navigate, Enter to select.
      </p>
    </div>
  )
}
