"use client"

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react"

interface VennDiagramProps {
  onSectionClick: (section: string) => void | Promise<void>
  selectedSection: string | null
}

export default function VennDiagram({ onSectionClick, selectedSection }: VennDiagramProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  // Define the sections of the Venn diagram with improved colors and better positioning
  const sections = [
    {
      id: "A",
      label: "16°C",
      color: "rgba(147, 51, 234, 0.5)",
      hoverColor: "rgba(147, 51, 234, 0.75)",
      activeColor: "rgba(147, 51, 234, 0.9)",
      description: "Genes expressed at 16°C",
      cx: 160,
      cy: 140,
      r: 80,
    },
    {
      id: "B",
      label: "38°C",
      color: "rgba(59, 130, 246, 0.5)",
      hoverColor: "rgba(59, 130, 246, 0.75)",
      activeColor: "rgba(59, 130, 246, 0.9)",
      description: "Genes expressed at 38°C",
      cx: 280,
      cy: 140,
      r: 80,
    },
    {
      id: "C",
      label: "41°C",
      color: "rgba(236, 72, 153, 0.5)",
      hoverColor: "rgba(236, 72, 153, 0.75)",
      activeColor: "rgba(236, 72, 153, 0.9)",
      description: "Genes expressed at 41°C",
      cx: 220,
      cy: 220,
      r: 80,
    },
    {
      id: "AB",
      label: "16°C ∩ 38°C",
      color: "rgba(139, 92, 246, 0.6)",
      hoverColor: "rgba(139, 92, 246, 0.8)",
      activeColor: "rgba(139, 92, 246, 0.95)",
      description: "Common genes between 16°C and 38°C",
    },
    {
      id: "AC",
      label: "16°C ∩ 41°C",
      color: "rgba(190, 24, 185, 0.6)",
      hoverColor: "rgba(190, 24, 185, 0.8)",
      activeColor: "rgba(190, 24, 185, 0.95)",
      description: "Common genes between 16°C and 41°C",
    },
    {
      id: "BC",
      label: "38°C ∩ 41°C",
      color: "rgba(79, 70, 229, 0.6)",
      hoverColor: "rgba(79, 70, 229, 0.8)",
      activeColor: "rgba(79, 70, 229, 0.95)",
      description: "Common genes between 38°C and 41°C",
    },
    {
      id: "ABC",
      label: "16°C ∩ 38°C ∩ 41°C",
      color: "rgba(255, 255, 255, 0.9)",
      hoverColor: "rgba(248, 250, 252, 0.95)",
      activeColor: "rgba(241, 245, 249, 1)",
      description: "Common genes across all temperatures",
      cx: 220,
      cy: 180,
      r: 25,
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

  // Handle click with animation
  const handleSectionClick = useCallback((sectionId: string) => {
    setIsAnimating(true)
    onSectionClick(sectionId)
    setTimeout(() => setIsAnimating(false), 300)
  }, [onSectionClick])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent<HTMLElement> | any) => {
      if (e.key === "Enter" && hoveredSection) {
        handleSectionClick(hoveredSection)
      } else if (e.key === "Escape") {
        setHoveredSection(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hoveredSection, handleSectionClick])

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
    <div className="w-full max-w-4xl mx-auto relative">
      <svg
        ref={svgRef}
        viewBox="0 0 440 320"
        className={`w-full h-auto drop-shadow-2xl transition-all duration-500 ${
          isAnimating ? 'scale-105' : 'scale-100'
        }`}
        role="img"
        aria-label="Interactive Venn diagram with three temperatures: 16°C, 38°C and 41°C"
      >
        <title>Interactive Venn diagram of genes expressed at different temperatures</title>
        <desc>
          A Venn diagram showing genes expressed at different temperatures (16°C, 38°C, 41°C) and their intersections.
          Click on any section to see more information about genes expressed under those conditions.
        </desc>

        <defs>
          {/* Gradientes modernos más suaves */}
          <radialGradient id="gradientA" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
            <stop offset="70%" stopColor="rgba(147, 51, 234, 0.6)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.8)" />
          </radialGradient>
          
          <radialGradient id="gradientB" cx="70%" cy="30%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="70%" stopColor="rgba(59, 130, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.8)" />
          </radialGradient>
          
          <radialGradient id="gradientC" cx="50%" cy="70%">
            <stop offset="0%" stopColor="rgba(236, 72, 153, 0.3)" />
            <stop offset="70%" stopColor="rgba(236, 72, 153, 0.6)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0.8)" />
          </radialGradient>

          {/* Filtros mejorados */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.25)" />
          </filter>

          <filter id="hoverGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Círculos principales con gradientes */}
        <circle
          cx="160"
          cy="140"
          r="80"
          fill="url(#gradientA)"
          fillOpacity={selectedSection === "A" ? "0.9" : hoveredSection === "A" ? "0.7" : "0.5"}
          stroke="rgba(147, 51, 234, 0.8)"
          strokeWidth={selectedSection === "A" ? "4" : hoveredSection === "A" ? "3" : "2"}
          filter={hoveredSection === "A" || selectedSection === "A" ? "url(#hoverGlow)" : "url(#shadow)"}
          onClick={() => handleSectionClick("A")}
          onMouseEnter={() => setHoveredSection("A")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300 transform-gpu"
          style={{
            transform: selectedSection === "A" ? "scale(1.05)" : hoveredSection === "A" ? "scale(1.02)" : "scale(1)",
            transformOrigin: "160px 140px"
          }}
          role="button"
          tabIndex={0}
          data-section="A"
        />

        <circle
          cx="280"
          cy="140"
          r="80"
          fill="url(#gradientB)"
          fillOpacity={selectedSection === "B" ? "0.9" : hoveredSection === "B" ? "0.7" : "0.5"}
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth={selectedSection === "B" ? "4" : hoveredSection === "B" ? "3" : "2"}
          filter={hoveredSection === "B" || selectedSection === "B" ? "url(#hoverGlow)" : "url(#shadow)"}
          onClick={() => handleSectionClick("B")}
          onMouseEnter={() => setHoveredSection("B")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300 transform-gpu"
          style={{
            transform: selectedSection === "B" ? "scale(1.05)" : hoveredSection === "B" ? "scale(1.02)" : "scale(1)",
            transformOrigin: "280px 140px"
          }}
          role="button"
          tabIndex={0}
          data-section="B"
        />

        <circle
          cx="220"
          cy="220"
          r="80"
          fill="url(#gradientC)"
          fillOpacity={selectedSection === "C" ? "0.9" : hoveredSection === "C" ? "0.7" : "0.5"}
          stroke="rgba(236, 72, 153, 0.8)"
          strokeWidth={selectedSection === "C" ? "4" : hoveredSection === "C" ? "3" : "2"}
          filter={hoveredSection === "C" || selectedSection === "C" ? "url(#hoverGlow)" : "url(#shadow)"}
          onClick={() => handleSectionClick("C")}
          onMouseEnter={() => setHoveredSection("C")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300 transform-gpu"
          style={{
            transform: selectedSection === "C" ? "scale(1.05)" : hoveredSection === "C" ? "scale(1.02)" : "scale(1)",
            transformOrigin: "220px 220px"
          }}
          role="button"
          tabIndex={0}
          data-section="C"
        />

        {/* Áreas de intersección clickeables (invisibles pero funcionales) */}
        {/* Intersección AB */}
        <path
          d="M 200 100 A 80 80 0 0 1 240 120 A 80 80 0 0 0 220 155 A 80 80 0 0 0 200 140 A 80 80 0 0 1 200 100 Z"
          fill="rgba(139, 92, 246, 0.1)"
          fillOpacity={selectedSection === "AB" ? "0.8" : hoveredSection === "AB" ? "0.4" : "0"}
          stroke={selectedSection === "AB" ? "rgba(139, 92, 246, 0.9)" : hoveredSection === "AB" ? "rgba(139, 92, 246, 0.6)" : "transparent"}
          strokeWidth={selectedSection === "AB" ? "3" : "2"}
          onClick={() => handleSectionClick("AB")}
          onMouseEnter={() => setHoveredSection("AB")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="AB"
        />

        {/* Intersección AC */}
        <path
          d="M 180 180 A 80 80 0 0 1 200 155 A 80 80 0 0 0 220 155 A 80 80 0 0 0 200 200 A 80 80 0 0 1 180 180 Z"
          fill="rgba(190, 24, 185, 0.1)"
          fillOpacity={selectedSection === "AC" ? "0.8" : hoveredSection === "AC" ? "0.4" : "0"}
          stroke={selectedSection === "AC" ? "rgba(190, 24, 185, 0.9)" : hoveredSection === "AC" ? "rgba(190, 24, 185, 0.6)" : "transparent"}
          strokeWidth={selectedSection === "AC" ? "3" : "2"}
          onClick={() => handleSectionClick("AC")}
          onMouseEnter={() => setHoveredSection("AC")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="AC"
        />

        {/* Intersección BC */}
        <path
          d="M 240 155 A 80 80 0 0 1 260 180 A 80 80 0 0 0 240 200 A 80 80 0 0 0 220 155 A 80 80 0 0 1 240 155 Z"
          fill="rgba(79, 70, 229, 0.1)"
          fillOpacity={selectedSection === "BC" ? "0.8" : hoveredSection === "BC" ? "0.4" : "0"}
          stroke={selectedSection === "BC" ? "rgba(79, 70, 229, 0.9)" : hoveredSection === "BC" ? "rgba(79, 70, 229, 0.6)" : "transparent"}
          strokeWidth={selectedSection === "BC" ? "3" : "2"}
          onClick={() => handleSectionClick("BC")}
          onMouseEnter={() => setHoveredSection("BC")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300"
          role="button"
          tabIndex={0}
          data-section="BC"
        />

        {/* Centro - todas las intersecciones */}
        <circle
          cx="220"
          cy="180"
          r="25"
          fill="rgba(255, 255, 255, 0.9)"
          fillOpacity={selectedSection === "ABC" ? "1" : hoveredSection === "ABC" ? "0.95" : "0.9"}
          stroke={selectedSection === "ABC" ? "rgba(71, 85, 105, 0.9)" : hoveredSection === "ABC" ? "rgba(71, 85, 105, 0.7)" : "rgba(71, 85, 105, 0.5)"}
          strokeWidth={selectedSection === "ABC" ? "4" : hoveredSection === "ABC" ? "3" : "2"}
          filter={hoveredSection === "ABC" || selectedSection === "ABC" ? "url(#glow)" : "url(#shadow)"}
          onClick={() => handleSectionClick("ABC")}
          onMouseEnter={() => setHoveredSection("ABC")}
          onMouseLeave={() => setHoveredSection(null)}
          className="cursor-pointer transition-all duration-300 transform-gpu"
          style={{
            transform: selectedSection === "ABC" ? "scale(1.1)" : hoveredSection === "ABC" ? "scale(1.05)" : "scale(1)",
            transformOrigin: "220px 180px"
          }}
          role="button"
          tabIndex={0}
          data-section="ABC"
        />

        {/* Etiquetas de temperatura con mejor posicionamiento */}
        <text
          x="160"
          y="70"
          fill="rgba(147, 51, 234, 1)"
          fontWeight="bold"
          fontSize="18"
          textAnchor="middle"
          className="select-none font-mono"
          filter="url(#shadow)"
        >
          16°C
        </text>
        <text
          x="280"
          y="70"
          fill="rgba(59, 130, 246, 1)"
          fontWeight="bold"
          fontSize="18"
          textAnchor="middle"
          className="select-none font-mono"
          filter="url(#shadow)"
        >
          38°C
        </text>
        <text
          x="220"
          y="310"
          fill="rgba(236, 72, 153, 1)"
          fontWeight="bold"
          fontSize="18"
          textAnchor="middle"
          className="select-none font-mono"
          filter="url(#shadow)"
        >
          41°C
        </text>

        {/* Tooltip dinámico */}
        {hoveredSection && (
          <g className="animate-fadeIn">
            <rect
              x="320"
              y="30"
              width="100"
              height="60"
              rx="12"
              fill="rgba(0,0,0,0.9)"
              filter="url(#shadow)"
            />
            <text
              x="370"
              y="50"
              fill="white"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="select-none"
            >
              {sections.find((s) => s.id === hoveredSection)?.label}
            </text>
            <text
              x="370"
              y="70"
              fill="rgba(255,255,255,0.8)"
              fontSize="10"
              textAnchor="middle"
              className="select-none"
            >
              Click to explore
            </text>
          </g>
        )}
      </svg>
      {/* Leyenda moderna e interactiva */}
      <div className="mt-12 space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Interactive Sections
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
            Explore each region by clicking the buttons or directly on the diagram
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-500 border-2 backdrop-blur-sm transform hover:scale-105 ${
                selectedSection === section.id
                  ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-600 shadow-2xl scale-105"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xl"
              }`}
              aria-pressed={selectedSection === section.id}
              aria-label={section.description}
            >
              {/* Indicador de color animado */}
              <div className="flex items-start gap-3 mb-3">
                <div 
                  className={`w-4 h-4 rounded-full shadow-lg transition-all duration-300 ${
                    selectedSection === section.id || hoveredSection === section.id ? 'scale-125 shadow-xl' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: section.id === "A" ? "rgb(147, 51, 234)" :
                                   section.id === "B" ? "rgb(59, 130, 246)" :
                                   section.id === "C" ? "rgb(236, 72, 153)" :
                                   section.id === "ABC" ? "rgb(71, 85, 105)" :
                                   "rgb(139, 92, 246)",
                    boxShadow: selectedSection === section.id ? '0 0 20px rgba(147, 51, 234, 0.5)' : 'none'
                  }}
                />
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-base mb-1 leading-tight">
                    {section.label}
                  </h4>
                  <p className="text-xs opacity-80 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
              
              {/* Indicador de selección */}
              {selectedSection === section.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                </div>
              )}
              
              {/* Efecto de hover */}
              <div className={`absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 ${
                section.id === "A" ? "from-purple-500/10 to-purple-600/10" :
                section.id === "B" ? "from-blue-500/10 to-blue-600/10" :
                section.id === "C" ? "from-pink-500/10 to-pink-600/10" :
                "from-slate-500/10 to-slate-600/10"
              } ${hoveredSection === section.id ? 'opacity-100' : ''}`} />
            </button>
          ))}
        </div>
      </div>
      
      {/* Instrucciones de accesibilidad mejoradas */}
      <div className="sr-only">
        <p>
          This Venn diagram is fully interactive and accessible. Use the Tab key to navigate between sections and Enter to select.
        </p>
        <p>
          It includes seven regions: three individual sets (16°C, 38°C, 41°C), three pairwise intersections, and one central intersection of all three sets.
        </p>
      </div>
    </div>
  )
}

