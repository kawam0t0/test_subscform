import type { ProgressBarProps } from "../types"
import { Car } from "lucide-react"

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-6">
      <div className="relative w-full h-4">
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-full rounded-full transition-all duration-300 ease-in-out bg-primary relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 h-full w-2 bg-white opacity-75 animate-pulse"></div>
          </div>
          <div
            className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out"
            style={{ left: `${progress}%` }}
          >
            <Car size={24} className="text-primary fill-current" />
          </div>
        </div>
      </div>
    </div>
  )
}

