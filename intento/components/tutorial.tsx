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
      title: "Welcome to the Interactive Venn Diagram",
      description: "This tutorial will guide you through the main features of this tool.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Explore the Diagram",
      description:
        "Hover over the different sections of the diagram to see them highlighted. Each section represents a set or an intersection between sets.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Select a Section",
      description:
        "Click on any section of the diagram or use the quick selection buttons to view detailed information about that set or intersection.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Explore the Information",
      description:
        "The information panel displays details about the selected section, including description, examples, properties, and applications.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Accessibility Features",
      description:
        "You can navigate the diagram using the keyboard. Use Tab to move between sections and Enter to select. You can also use Esc to reset the selection.",
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
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">{steps[step].title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tutorial">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
              <img
                src={steps[step].image || "/placeholder.svg"}
                alt={`Tutorial step ${step + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6">{steps[step].description}</p>

            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === step ? "bg-primary" : "bg-border"}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                <Button onClick={nextStep}>
                  {step < steps.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    "Finish"
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

