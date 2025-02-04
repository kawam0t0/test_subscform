"use client"

import { useState } from "react"
import { Droplet } from "lucide-react"
import { ErrorMessage } from "./ErrorMessage"
import { OperationSelection } from "./OperationSelection"
import { PersonalInfo } from "./PersonalInfo"
import { VehicleInfo } from "./VehicleInfo"
import { Confirmation } from "./Confirmation"
import { ProgressBar } from "./ProgressBar"
import { CourseSelection } from "./CourseSelection"
import { ThankYou } from "./ThankYou"
import { NewVehicleInfo } from "./NewVehicleInfo"
import { CourseChangeForm } from "./CourseChangeForm"
import { NewPaymentInfo } from "./NewPaymentInfo"
import type { FormData } from "../types"

export function CustomerForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    operation: "",
    store: "",
    name: "",
    email: "",
    phone: "",
    carModel: "",
    carColor: "",
    licensePlate: "", // Add this
    cardToken: "",
    referenceId: "",
    course: "",
    newCarModel: "",
    newCarColor: "",
    newLicensePlate: "", // Add this
    currentCourse: "",
    newCourse: "",
  })
  const [error, setError] = useState<string | null>(null)

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const submitForm = async () => {
    try {
      setError(null)
      console.log("送信データ:", formData)

      const endpoint = formData.operation === "入会" ? "/api/create-customer" : "/api/update-customer"

      console.log("送信先エンドポイント:", endpoint)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("APIレスポンス:", data)

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("お客様情報の登録がありません。初めから再度ご入力ください")
        } else {
          throw new Error(data.error || `エラーが発生しました: ${response.status}`)
        }
      }

      if (data.success) {
        setStep(7) // ThankYou コンポーネントを表示
      } else {
        throw new Error(data.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("フォーム送信エラー:", error)
      setError(error instanceof Error ? error.message : "お客様情報の登録がありません。初めから再度ご入力ください")
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
        if (formData.operation === "洗車コース変更") {
          return (
            <CourseChangeForm
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else if (formData.operation === "クレジットカード情報変更") {
          return (
            <VehicleInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
          )
        } else {
          return (
            <VehicleInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
          )
        }
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
        } else if (formData.operation === "登録車両変更") {
          return (
            <NewVehicleInfo
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else if (formData.operation === "クレジットカード情報変更") {
          return (
            <NewPaymentInfo
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        }
      case 5:
        if (formData.operation === "入会") {
          return (
            <NewPaymentInfo
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else if (formData.operation === "クレジットカード情報変更" || formData.operation === "登録車両変更") {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        } else {
          return <ThankYou formData={formData} />
        }
      case 6:
        return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
      case 7:
        return <ThankYou formData={formData} />
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

