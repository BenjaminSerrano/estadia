"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface TutorialProps {
  onClose: () => void
}

export default function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: "Bienvenido al Diagrama de Venn Interactivo",
      description: "Este tutorial te guiará a través de las características principales de esta herramienta.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Explora el Diagrama",
      description:
        "Pasa el cursor sobre las diferentes secciones del diagrama para ver su resaltado. Cada sección representa un conjunto o una intersección entre conjuntos.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Selecciona una Sección",
      description:
        "Haz clic en cualquier sección del diagrama o usa los botones de selección rápida para ver información detallada sobre ese conjunto o intersección.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Explora la Información",
      description:
        "El panel de información muestra detalles sobre la sección seleccionada, incluyendo descripción, ejemplos, propiedades y aplicaciones.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Características de Accesibilidad",
      description:
        "Puedes navegar por el diagrama usando el teclado. Usa Tab para moverte entre secciones y Enter para seleccionar. También puedes usar Esc para restablecer la selección.",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{steps[step].title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar tutorial">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
              <img
                src={steps[step].image || "/placeholder.svg"}
                alt={`Tutorial paso ${step + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6">{steps[step].description}</p>

            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === step ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                )}
                <Button onClick={nextStep}>
                  {step < steps.length - 1 ? (
                    <>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    "Finalizar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

