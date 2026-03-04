"use client"

import { useState, useEffect, useRef } from "react"

interface VennDiagramProps {
  onSectionClick: (section: string) => void | Promise<void>
  selectedSection: string | null
}

// ─── Geometry ────────────────────────────────────────────────────────────────
const CX = { A: 160, B: 280, C: 220 }
const CY = { A: 140, B: 140, C: 220 }
const R  = 80
const VW = 440
const VH = 320

// ─── Temperature-semantic palette ────────────────────────────────────────────
const PALETTE = {
  A:   { base: "rgba(14,165,233,0.28)",  hover: "rgba(14,165,233,0.55)",  active: "rgba(14,165,233,0.80)",  ring: "rgb(14,165,233)",   label: "16°C",           desc: "Genes expressed at 16°C" },
  B:   { base: "rgba(245,158,11,0.28)", hover: "rgba(245,158,11,0.55)", active: "rgba(245,158,11,0.80)", ring: "rgb(245,158,11)",  label: "38°C",           desc: "Genes expressed at 38°C" },
  C:   { base: "rgba(239,68,68,0.28)",  hover: "rgba(239,68,68,0.55)",  active: "rgba(239,68,68,0.80)",  ring: "rgb(239,68,68)",   label: "41°C",           desc: "Genes expressed at 41°C" },
  AB:  { base: "rgba(20,184,166,0.38)", hover: "rgba(20,184,166,0.62)", active: "rgba(20,184,166,0.85)", ring: "rgb(20,184,166)",  label: "16°C ∩ 38°C",   desc: "Common genes: 16°C & 38°C" },
  AC:  { base: "rgba(168,85,247,0.38)", hover: "rgba(168,85,247,0.62)", active: "rgba(168,85,247,0.85)", ring: "rgb(168,85,247)",  label: "16°C ∩ 41°C",   desc: "Common genes: 16°C & 41°C" },
  BC:  { base: "rgba(249,115,22,0.38)", hover: "rgba(249,115,22,0.62)", active: "rgba(249,115,22,0.85)", ring: "rgb(249,115,22)",  label: "38°C ∩ 41°C",   desc: "Common genes: 38°C & 41°C" },
  ABC: { base: "rgba(255,255,255,0.45)",hover: "rgba(255,255,255,0.70)",active: "rgba(255,255,255,0.90)",ring: "rgb(255,255,255)", label: "All temps",      desc: "Common genes across all temperatures" },
} as const

type SectionId = keyof typeof PALETTE

const SECTIONS: SectionId[] = ["A", "B", "C", "AB", "AC", "BC", "ABC"]

// Which circles border each region (for ring highlighting)
const BORDERS: Record<SectionId, Array<"A" | "B" | "C">> = {
  A: ["A"], B: ["B"], C: ["C"],
  AB: ["A", "B"], AC: ["A", "C"], BC: ["B", "C"], ABC: ["A", "B", "C"],
}

export default function VennDiagram({ onSectionClick, selectedSection }: VennDiagramProps) {
  const [hovered, setHovered] = useState<SectionId | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // ─── Color helpers ─────────────────────────────────────────────────────────
  const fill = (id: SectionId) => {
    const p = PALETTE[id]
    if (selectedSection === id) return p.active
    if (hovered === id)         return p.hover
    return p.base
  }

  const ringOpacity = (letter: "A" | "B" | "C") => {
    const sid = selectedSection as SectionId | null
    const hid = hovered
    const active = sid ?? hid
    if (!active) return "0.35"
    const borders = BORDERS[active] ?? []
    return borders.includes(letter) ? "1" : "0.25"
  }

  const ringWidth = (letter: "A" | "B" | "C") => {
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
    "aria-label": PALETTE[id].desc,
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

  const tooltip = hovered ? PALETTE[hovered] : null

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-auto"
        role="img"
        aria-label="Interactive Venn diagram — three temperature conditions"
      >
        <title>Interactive Venn diagram of genes expressed at different temperatures</title>

        <defs>
          {/* ── Clip paths for the 3 circles ── */}
          <clipPath id="cp-A">
            <circle cx={CX.A} cy={CY.A} r={R} />
          </clipPath>
          <clipPath id="cp-B">
            <circle cx={CX.B} cy={CY.B} r={R} />
          </clipPath>
          <clipPath id="cp-C">
            <circle cx={CX.C} cy={CY.C} r={R} />
          </clipPath>

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
        {(["A", "B", "C"] as const).map((letter) => (
          <circle
            key={letter}
            cx={CX[letter]} cy={CY[letter]} r={R}
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

        {/* ── A (entire circle A — AB, AC, ABC rendered on top) ── */}
        <g clipPath="url(#cp-A)">
          <rect {...rp("A")} />
        </g>

        {/* ── B ── */}
        <g clipPath="url(#cp-B)">
          <rect {...rp("B")} />
        </g>

        {/* ── C ── */}
        <g clipPath="url(#cp-C)">
          <rect {...rp("C")} />
        </g>

        {/* ── AB = A ∩ B ── */}
        <g clipPath="url(#cp-A)">
          <rect clipPath="url(#cp-B)" {...rp("AB")} />
        </g>

        {/* ── AC = A ∩ C ── */}
        <g clipPath="url(#cp-A)">
          <rect clipPath="url(#cp-C)" {...rp("AC")} />
        </g>

        {/* ── BC = B ∩ C ── */}
        <g clipPath="url(#cp-B)">
          <rect clipPath="url(#cp-C)" {...rp("BC")} />
        </g>

        {/* ── ABC = A ∩ B ∩ C — topmost, always wins ── */}
        <g clipPath="url(#cp-A)">
          <g clipPath="url(#cp-B)">
            <rect clipPath="url(#cp-C)" {...rp("ABC")} />
          </g>
        </g>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 — temperature labels (outside circles, non-interactive)
        ═══════════════════════════════════════════════════════════════════ */}
        <text
          x="90" y="88"
          fill={PALETTE.A.ring} fontSize="15" fontWeight="700"
          textAnchor="middle" fontFamily="var(--font-mono), monospace"
          pointerEvents="none"
          opacity={hovered && !BORDERS[hovered].includes("A") && selectedSection && !BORDERS[selectedSection as SectionId]?.includes("A") ? "0.4" : "1"}
          style={{ transition: "opacity 0.2s" }}
        >16°C</text>
        <text
          x="350" y="88"
          fill={PALETTE.B.ring} fontSize="15" fontWeight="700"
          textAnchor="middle" fontFamily="var(--font-mono), monospace"
          pointerEvents="none"
          opacity={hovered && !BORDERS[hovered].includes("B") && selectedSection && !BORDERS[selectedSection as SectionId]?.includes("B") ? "0.4" : "1"}
          style={{ transition: "opacity 0.2s" }}
        >38°C</text>
        <text
          x="220" y="315"
          fill={PALETTE.C.ring} fontSize="15" fontWeight="700"
          textAnchor="middle" fontFamily="var(--font-mono), monospace"
          pointerEvents="none"
          opacity={hovered && !BORDERS[hovered].includes("C") && selectedSection && !BORDERS[selectedSection as SectionId]?.includes("C") ? "0.4" : "1"}
          style={{ transition: "opacity 0.2s" }}
        >41°C</text>

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
        {SECTIONS.map((id) => {
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
                {p.label}
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
        Interactive Venn diagram with seven clickable regions: 16°C only, 38°C only, 41°C only,
        intersections 16∩38, 16∩41, 38∩41, and the triple intersection. Use Tab to navigate, Enter to select.
      </p>
    </div>
  )
}
