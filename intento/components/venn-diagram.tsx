"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"

interface VennDiagramProps {
  onSectionClick: (section: string) => void | Promise<void>
  selectedSection: string | null
}

export default function VennDiagram({ onSectionClick, selectedSection }: VennDiagramProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Define the sections of the Venn diagram with improved colors and better positioning
  const sections = [
    {
      id: "A",
      label: "16°C",
      color: "rgba(147, 51, 234, 0.4)",
      hoverColor: "rgba(147, 51, 234, 0.65)",
      activeColor: "rgba(147, 51, 234, 0.85)",
      description: "Genes expresados a 16°C",
      cx: 180,
      cy: 160,
      r: 110,
    },
    {
      id: "B",
      label: "38°C",
      color: "rgba(59, 130, 246, 0.4)",
      hoverColor: "rgba(59, 130, 246, 0.65)",
      activeColor: "rgba(59, 130, 246, 0.85)",
      description: "Genes expresados a 38°C",
      cx: 260,
      cy: 160,
      r: 110,
    },
    {
      id: "C",
      label: "41°C",
      color: "rgba(236, 72, 153, 0.4)",
      hoverColor: "rgba(236, 72, 153, 0.65)",
      activeColor: "rgba(236, 72, 153, 0.85)",
      description: "Genes expresados a 41°C",
      cx: 220,
      cy: 240,
      r: 110,
    },
    {
      id: "AB",
      label: "16°C ∩ 38°C",
      color: "rgba(139, 92, 246, 0.5)",
      hoverColor: "rgba(139, 92, 246, 0.7)",
      activeColor: "rgba(139, 92, 246, 0.9)",
      description: "Genes comunes entre 16°C y 38°C",
    },
    {
      id: "AC",
      label: "16°C ∩ 41°C",
      color: "rgba(190, 24, 185, 0.5)",
      hoverColor: "rgba(190, 24, 185, 0.7)",
      activeColor: "rgba(190, 24, 185, 0.9)",
      description: "Genes comunes entre 16°C y 41°C",
    },
    {
      id: "BC",
      label: "38°C ∩ 41°C",
      color: "rgba(79, 70, 229, 0.5)",
      hoverColor: "rgba(79, 70, 229, 0.7)",
      activeColor: "rgba(79, 70, 229, 0.9)",
      description: "Genes comunes entre 38°C y 41°C",
    },
    {
      id: "ABC",
      label: "16°C ∩ 38°C ∩ 41°C",
      color: "rgba(255, 255, 255, 0.9)",
      hoverColor: "rgba(248, 250, 252, 0.95)",
      activeColor: "rgba(241, 245, 249, 1)",
      description: "Genes comunes en todas las temperaturas",
      cx: 220,
      cy: 190,
      r: 35,
    },
  ]

  // Get the color for a section based on its state
  const getSectionColor = (id: string) => {
    const section = sections.find((s) => s.id === id)
    if (!section) return "rgba(200, 200, 200, 0.7)"

    if (selectedSection === id) return section.activeColor
    if (hoveredSection === id) return section.hoverColor
    return section.color
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent<HTMLElement> | any) => {
      if (e.key === "Enter" && hoveredSection) {
        onSectionClick(hoveredSection)
      } else if (e.key === "Escape") {
        setHoveredSection(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hoveredSection, onSectionClick])

  // Focus trap for keyboard navigation
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent<HTMLElement> | any) => {
      if (e.key === "Tab" && svgRef.current) {
        const focusableElements = svgRef.current.querySelectorAll('[tabindex="0"]')
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", handleTabKey)
    return () => window.removeEventListener("keydown", handleTabKey)
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <svg
        ref={svgRef}
        viewBox="0 0 440 360"
        className="w-full h-auto drop-shadow-xl"
        role="img"
        aria-label="Diagrama de Venn interactivo con tres temperaturas: 16°C, 38°C y 41°C"
      >
        <title>Diagrama de Venn interactivo de genes expresados a diferentes temperaturas</title>
        <desc>
          Un diagrama de Venn que muestra genes expresados a diferentes temperaturas (16°C, 38°C, 41°C) y sus intersecciones.
          Haz clic en cualquier sección para ver más información sobre los genes expresados en esas condiciones.
        </desc>

        <defs>
          {/* Gradientes modernos */}
          <radialGradient id="gradientA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.2)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.6)" />
          </radialGradient>
          
          <radialGradient id="gradientB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
          </radialGradient>
          
          <radialGradient id="gradientC" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(236, 72, 153, 0.2)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0.6)" />
          </radialGradient>
          
          <radialGradient id="gradientABC" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
            <stop offset="100%" stopColor="rgba(241, 245, 249, 0.95)" />
          </radialGradient>

          {/* Filtros para efectos visuales */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
          </filter>
        </defs>

        {/* Círculos de fondo (solo bordes) */}
        <circle
          cx="160"
          cy="140"
          r="80"
          fill="none"
          stroke="rgba(147, 51, 234, 0.6)"
          strokeWidth="2"
        />
        <circle
          cx="280"
          cy="140"
          r="80"
          fill="none"
          stroke="rgba(59, 130, 246, 0.6)"
          strokeWidth="2"
        />
        <circle
          cx="220"
          cy="220"
          r="80"
          fill="none"
          stroke="rgba(236, 72, 153, 0.6)"
          strokeWidth="2"
        />

        {/* Región A exclusiva (16°C solamente) */}
        <path
          d="M 160 140 
             A 80 80 0 0 1 200 70
             A 80 80 0 0 1 220 100
             A 80 80 0 0 0 180 120
             A 80 80 0 0 0 140 140
             A 80 80 0 0 1 160 140 Z"
          fill={selectedSection === "A" ? "rgba(147, 51, 234, 0.8)" : hoveredSection === "A" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.4)"}
          stroke={selectedSection === "A" ? "rgba(147, 51, 234, 0.9)" : "rgba(147, 51, 234, 0.5)"}
          strokeWidth={selectedSection === "A" ? "3" : "2"}
          onClick={() => onSectionClick("A")}
          onMouseEnter={() => setHoveredSection("A")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="A"
        />

        {/* Región B exclusiva (38°C solamente) */}
        <path
          d="M 280 140
             A 80 80 0 0 1 320 100
             A 80 80 0 0 1 340 140
             A 80 80 0 0 1 320 180
             A 80 80 0 0 0 280 160
             A 80 80 0 0 0 260 140
             A 80 80 0 0 1 280 140 Z"
          fill={selectedSection === "B" ? "rgba(59, 130, 246, 0.8)" : hoveredSection === "B" ? "rgba(59, 130, 246, 0.6)" : "rgba(59, 130, 246, 0.4)"}
          stroke={selectedSection === "B" ? "rgba(59, 130, 246, 0.9)" : "rgba(59, 130, 246, 0.5)"}
          strokeWidth={selectedSection === "B" ? "3" : "2"}
          onClick={() => onSectionClick("B")}
          onMouseEnter={() => setHoveredSection("B")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="B"
        />

        {/* Región C exclusiva (41°C solamente) */}
        <path
          d="M 220 220
             A 80 80 0 0 1 180 240
             A 80 80 0 0 1 160 280
             A 80 80 0 0 1 220 300
             A 80 80 0 0 1 280 280
             A 80 80 0 0 1 260 240
             A 80 80 0 0 0 240 200
             A 80 80 0 0 0 200 200
             A 80 80 0 0 1 220 220 Z"
          fill={selectedSection === "C" ? "rgba(236, 72, 153, 0.8)" : hoveredSection === "C" ? "rgba(236, 72, 153, 0.6)" : "rgba(236, 72, 153, 0.4)"}
          stroke={selectedSection === "C" ? "rgba(236, 72, 153, 0.9)" : "rgba(236, 72, 153, 0.5)"}
          strokeWidth={selectedSection === "C" ? "3" : "2"}
          onClick={() => onSectionClick("C")}
          onMouseEnter={() => setHoveredSection("C")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="C"
        />

        {/* Región AB (16°C ∩ 38°C, excluyendo C) */}
        <path
          d="M 200 100
             A 80 80 0 0 1 240 100
             A 80 80 0 0 0 240 140
             A 80 80 0 0 0 200 140
             A 80 80 0 0 1 200 100 Z"
          fill={selectedSection === "AB" ? "rgba(139, 92, 246, 0.8)" : hoveredSection === "AB" ? "rgba(139, 92, 246, 0.6)" : "rgba(139, 92, 246, 0.4)"}
          stroke={selectedSection === "AB" ? "rgba(139, 92, 246, 0.9)" : "rgba(139, 92, 246, 0.5)"}
          strokeWidth={selectedSection === "AB" ? "3" : "2"}
          onClick={() => onSectionClick("AB")}
          onMouseEnter={() => setHoveredSection("AB")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="AB"
        />

        {/* Región AC (16°C ∩ 41°C, excluyendo B) */}
        <path
          d="M 180 180
             A 80 80 0 0 1 200 140
             A 80 80 0 0 0 200 180
             A 80 80 0 0 0 180 200
             A 80 80 0 0 1 180 180 Z"
          fill={selectedSection === "AC" ? "rgba(190, 24, 185, 0.8)" : hoveredSection === "AC" ? "rgba(190, 24, 185, 0.6)" : "rgba(190, 24, 185, 0.4)"}
          stroke={selectedSection === "AC" ? "rgba(190, 24, 185, 0.9)" : "rgba(190, 24, 185, 0.5)"}
          strokeWidth={selectedSection === "AC" ? "3" : "2"}
          onClick={() => onSectionClick("AC")}
          onMouseEnter={() => setHoveredSection("AC")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="AC"
        />

        {/* Región BC (38°C ∩ 41°C, excluyendo A) */}
        <path
          d="M 240 140
             A 80 80 0 0 1 260 180
             A 80 80 0 0 0 240 200
             A 80 80 0 0 0 240 140 Z"
          fill={selectedSection === "BC" ? "rgba(79, 70, 229, 0.8)" : hoveredSection === "BC" ? "rgba(79, 70, 229, 0.6)" : "rgba(79, 70, 229, 0.4)"}
          stroke={selectedSection === "BC" ? "rgba(79, 70, 229, 0.9)" : "rgba(79, 70, 229, 0.5)"}
          strokeWidth={selectedSection === "BC" ? "3" : "2"}
          onClick={() => onSectionClick("BC")}
          onMouseEnter={() => setHoveredSection("BC")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="BC"
        />

        {/* Región ABC (Centro - todas las temperaturas) */}
        <circle
          cx="220"
          cy="160"
          r="18"
          fill={selectedSection === "ABC" ? "rgba(255, 255, 255, 0.9)" : hoveredSection === "ABC" ? "rgba(248, 250, 252, 0.8)" : "rgba(241, 245, 249, 0.7)"}
          stroke={selectedSection === "ABC" ? "rgba(71, 85, 105, 0.9)" : "rgba(71, 85, 105, 0.5)"}
          strokeWidth={selectedSection === "ABC" ? "3" : "2"}
          onClick={() => onSectionClick("ABC")}
          onMouseEnter={() => setHoveredSection("ABC")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="ABC"
        />

        {/* Números en cada región */}
        {/* Región 1: Solo A (16°C) */}
        <text
          x="140"
          y="110"
          fill="white"
          fontWeight="bold"
          fontSize="16"
          textAnchor="middle"
          onClick={() => onSectionClick("A")}
          className="cursor-pointer select-none"
        >
          1
        </text>

        {/* Región 2: Solo B (38°C) */}
        <text
          x="300"
          y="110"
          fill="white"
          fontWeight="bold"
          fontSize="16"
          textAnchor="middle"
          onClick={() => onSectionClick("B")}
          className="cursor-pointer select-none"
        >
          2
        </text>

        {/* Región 3: Solo C (41°C) */}
        <text
          x="220"
          y="270"
          fill="white"
          fontWeight="bold"
          fontSize="16"
          textAnchor="middle"
          onClick={() => onSectionClick("C")}
          className="cursor-pointer select-none"
        >
          3
        </text>

        {/* Región 4: A ∩ B (16°C ∩ 38°C) */}
        <text
          x="220"
          y="115"
          fill="white"
          fontWeight="bold"
          fontSize="14"
          textAnchor="middle"
          onClick={() => onSectionClick("AB")}
          className="cursor-pointer select-none"
        >
          4
        </text>

        {/* Región 5: A ∩ C (16°C ∩ 41°C) */}
        <text
          x="190"
          y="180"
          fill="white"
          fontWeight="bold"
          fontSize="14"
          textAnchor="middle"
          onClick={() => onSectionClick("AC")}
          className="cursor-pointer select-none"
        >
          5
        </text>

        {/* Región 6: B ∩ C (38°C ∩ 41°C) */}
        <text
          x="250"
          y="180"
          fill="white"
          fontWeight="bold"
          fontSize="14"
          textAnchor="middle"
          onClick={() => onSectionClick("BC")}
          className="cursor-pointer select-none"
        >
          6
        </text>

        {/* Región 7: A ∩ B ∩ C (Centro) */}
        <text
          x="220"
          y="165"
          fill="rgba(71, 85, 105, 0.9)"
          fontWeight="bold"
          fontSize="14"
          textAnchor="middle"
          onClick={() => onSectionClick("ABC")}
          className="cursor-pointer select-none"
        >
          7
        </text>

        {/* Etiquetas de temperatura */}
        <text
          x="160"
          y="80"
          fill="rgba(147, 51, 234, 0.9)"
          fontWeight="bold"
          fontSize="16"
          textAnchor="middle"
        >
          16°C
        </text>
        <text
          x="280"
          y="80"
          fill="rgba(59, 130, 246, 0.9)"
          fontWeight="bold"
          fontSize="16"
          textAnchor="middle"
        >
          38°C
        </text>
        <text
          x="220"
          y="320"
          fill="rgba(236, 72, 153, 0.9)"
          fontWeight="bold"
          fontSize="16"
          textAnchor="middle"
        >
          41°C
        </text>

        {/* Tooltips modernos */}
        {hoveredSection && (
          <g>
            <rect
              x={hoveredSection === "A" ? 50 : hoveredSection === "B" ? 280 : hoveredSection === "C" ? 170 : hoveredSection === "ABC" ? 150 : 120}
              y={hoveredSection === "A" || hoveredSection === "B" ? 70 : hoveredSection === "C" ? 290 : hoveredSection === "ABC" ? 140 : 180}
              width={hoveredSection === "ABC" ? 140 : 120}
              height="40"
              rx="8"
              fill="rgba(0,0,0,0.85)"
              filter="url(#shadow)"
            />
            <text
              x={hoveredSection === "A" ? 110 : hoveredSection === "B" ? 340 : hoveredSection === "C" ? 230 : hoveredSection === "ABC" ? 220 : 180}
              y={hoveredSection === "A" || hoveredSection === "B" ? 95 : hoveredSection === "C" ? 315 : hoveredSection === "ABC" ? 165 : 205}
              fill="white"
              fontSize="12"
              textAnchor="middle"
              fontWeight="500"
            >
              {(() => {
                  const description = sections.find((s) => s.id === hoveredSection)?.description;
                  return typeof description === 'string' ? description : '';
              })()}
            </text>
          </g>
        )}
      </svg>
      {/* Leyenda moderna del diagrama */}
      <div className="mt-8">
        <h3 className="text-center text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Secciones del Diagrama
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={`group relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border-2 ${
                selectedSection === section.id
                  ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white border-slate-600 shadow-lg scale-105 transform"
                  : "bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:scale-102"
              } backdrop-blur-sm`}
              aria-pressed={selectedSection === section.id}
              aria-label={section.description}
            >
              <div className="flex flex-col items-center gap-1">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    section.id === "A" ? "bg-purple-500" :
                    section.id === "B" ? "bg-blue-500" :
                    section.id === "C" ? "bg-pink-500" :
                    section.id === "ABC" ? "bg-slate-500" :
                    "bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"
                  }`}
                />
                <span className="leading-tight">{section.label}</span>
              </div>
              {selectedSection === section.id && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Instrucciones de accesibilidad */}
      <div className="sr-only">
        <p>
          Este diagrama de Venn es interactivo. Usa la tecla Tab para navegar entre las secciones y Enter para
          seleccionar una sección.
        </p>
        <p>
          Hay siete secciones: Genes a 16°C, Genes a 38°C, Genes a 41°C, Genes comunes entre 16°C y 38°C, Genes comunes entre 16°C y 41°C,
          Genes comunes entre 38°C y 41°C, y Genes comunes en todas las temperaturas.
        </p>
      </div>
    </div>
  )
}

