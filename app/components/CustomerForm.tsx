"use client"

import { useState } from "react"
import { Droplet } from "lucide-react"
import { ErrorMessage } from "./ErrorMessage"
import { OperationSelection } from "./OperationSelection"
import { PersonalInfo } from "./PersonalInfo"
import { VehicleInfo } from "./VehicleInfo"
import { PaymentInfo } from "./PaymentInfo"
import { Confirmation } from "./Confirmation"
import { ProgressBar } from "./ProgressBar"
import { CourseSelection } from "./CourseSelection"
import { ThankYou } from "./ThankYou"
import { NewVehicleInfo } from "./NewVehicleInfo"
import type { FormData } from "../types"

// CustomerFormコンポーネントをexport defaultに変更
export default function CustomerForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    operation: "",
    store: "",
    name: "",
    email: "",
    phone: "",
    carModel: "",
    carColor: "",
    cardToken: "",
    referenceId: "",
    course: "",
    newCarModel: "",
    newCarColor: "",
  })
  const [error, setError] = useState<string | null>(null)

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const submitForm = async () => {
    try {
      setError(null)

      // 入会の場合のみコースの選択を必須とする
      if (formData.operation === "入会" && !formData.course) {
        setError("コースを選択してください")
        return
      }

      const response = await fetch("/api/create-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `エラーが発生しました: ${response.status}`)
      }

      if (data.success) {
        setStep(7)
      } else {
        throw new Error(data.error || "登録に失敗しました")
      }
    } catch (error) {
      console.error("フォーム送信エラー:", error)
      setError(error instanceof Error ? error.message : "エラーが発生しました")
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <OperationSelection formData={formData} updateFormData={updateFormData} nextStep={nextStep} />
      case 2:
        return (
          <PersonalInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
        )
      case 3:
        return (
          <VehicleInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
        )
      case 4:
        if (formData.operation === "入会") {
          return (
            <CourseSelection
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else {
          return (
            <NewVehicleInfo
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        }
      case 5:
        if (formData.operation === "入会") {
          return (
            <PaymentInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
          )
        } else {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        }
      case 6:
        if (formData.operation === "入会") {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        } else {
          return <ThankYou />
        }
      case 7:
        return <ThankYou />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="header">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center flex items-center justify-center">
          <Droplet className="mr-2 h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
          顧客情報フォーム
        </h1>
      </div>
      <div className="w-full bg-gray-50 min-h-[calc(100vh-5rem)] py-6 md:py-8 lg:py-10">
        <div className="form-container">
          {step < 7 && <ProgressBar currentStep={step} totalSteps={6} />}
          {error && <ErrorMessage message={error} />}
          <div className="mt-6 md:mt-8 lg:mt-10">{renderStep()}</div>
        </div>
      </div>
    </div>
  )
}

