import { useState } from "react"

// CustomerForm.tsxの該当部分を更新
const CustomerForm = () => {
  const [step, setStep] = useState(1) // Initialize step state
  const [error, setError] = useState("") // Initialize error state

  const renderStep = () => {
    // ... (rest of your step rendering logic) ...
    switch (step) {
      // ... (your step rendering cases) ...
      default:
        return <p>Step {step}</p>
    }
  }

  return (
    <div className="w-full bg-white min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto max-w-4xl py-8 sm:py-12">
        {step < 7 && <ProgressBar currentStep={step} totalSteps={6} />}
        {error && <ErrorMessage message={error} />}
        <div className="mt-8 sm:mt-12">{renderStep()}</div>
      </div>
    </div>
  )
}

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  // ... (ProgressBar component implementation) ...
}

const ErrorMessage = ({ message }: { message: string }) => {
  // ... (ErrorMessage component implementation) ...
}

export default CustomerForm

