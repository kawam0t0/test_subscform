import type { ProgressBarProps } from "../types"
import { Car } from "lucide-react"

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-8 mt-6">
      <div className="relative w-full h-6">
        <div className="absolute top-0 left-0 w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-in-out bg-primary relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div
          className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out"
          style={{ left: `${progress}%` }}
        >
          <div className="bg-white rounded-full p-1 shadow-lg -translate-x-1/2">
            <Car size={20} className="text-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

