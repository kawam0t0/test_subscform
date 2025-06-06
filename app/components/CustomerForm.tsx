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
import { PaymentInfo } from "./PaymentInfo"
import { OtherInquiryForm } from "./OtherInquiryForm"
import { NewVehicleInfo } from "./NewVehicleInfo"
import { EmailChangeForm } from "./EmailChangeForm"
import { NewPaymentInfo as CreditCardChangeForm } from "./NewPaymentInfo"
import CourseChangeForm from "./CourseChangeForm"
import type { FormData } from "../types"

export function CustomerForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    operation: "",
    store: "",
    familyName: "",
    givenName: "",
    email: "",
    phone: "",
    carModel: "",
    carColor: "",
    licensePlate: "",
    cardToken: "",
    referenceId: "",
    course: "",
    newCarModel: "",
    newCarColor: "",
    newLicensePlate: "",
    currentCourse: "",
    newCourse: "",
    inquiryDetails: "",
    newEmail: "",
    isLimitedProductStore: false,
    enableSubscription: false,
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

      // 操作タイプに応じたエンドポイントを選択
      let endpoint = "/api/create-customer"

      if (formData.operation === "各種手続き") {
        endpoint = "/api/submit-inquiry"
      } else if (formData.operation !== "入会") {
        endpoint = "/api/update-customer"
      }

      console.log("送信先エンドポイント:", endpoint)

      // 実際のAPIリクエスト
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("APIレスポンス:", data)

      if (!response.ok) {
        throw new Error(data.error || `エラーが発生しました: ${response.status}`)
      }

      if (data.success) {
        setStep(getTotalSteps() + 1) // ThankYou コンポーネントを表示
      } else {
        throw new Error(data.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("フォーム送信エラー:", error)
      setError(error instanceof Error ? error.message : "お客様情報の登録がありません。初めから再度ご入力ください")
      throw error
    }
  }

  const renderStep = () => {
    // 共通のステップ1と2
    if (step === 1) {
      return <OperationSelection formData={formData} updateFormData={updateFormData} nextStep={nextStep} />
    }

    if (step === 2) {
      return (
        <PersonalInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
      )
    }

    // 操作タイプに応じた分岐
    switch (formData.operation) {
      case "入会":
        // 入会フロー: OperationSelection → PersonalInfo → VehicleInfo → CourseSelection → PaymentInfo → Confirmation
        switch (step) {
          case 3:
            return (
              <VehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 4:
            return (
              <CourseSelection
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return (
              <PaymentInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 6:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 7:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "登録車両変更":
        switch (step) {
          case 3:
            return (
              <VehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 4:
            return (
              <NewVehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 6:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "クレジットカード情報変更":
        switch (step) {
          case 3:
            return (
              <VehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 4:
            return (
              <CreditCardChangeForm
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 6:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "メールアドレス変更":
        switch (step) {
          case 3:
            return (
              <VehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 4:
            return (
              <EmailChangeForm
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 6:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "各種手続き":
        switch (step) {
          case 3:
            return (
              <VehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 4:
            return (
              <OtherInquiryForm
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 6:
            return <ThankYou formData={formData} />
          default:
            return null
        }
      case "洗車コース変更":
        switch (step) {
          case 3:
            return (
              <VehicleInfo
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 4:
            return (
              <CourseChangeForm
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 6:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      default:
        return null
    }
  }

  // 現在のステップと操作タイプに基づいて総ステップ数を計算
  const getTotalSteps = () => {
    switch (formData.operation) {
      case "入会":
        return 6 // OperationSelection → PersonalInfo → VehicleInfo → CourseSelection → PaymentInfo → Confirmation
      case "登録車両変更":
      case "クレジットカード情報変更":
      case "メールアドレス変更":
      case "各種手続き":
      case "洗車コース変更":
        return 5 // OperationSelection → PersonalInfo → VehicleInfo → 専用フォーム → Confirmation
      default:
        return 6
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="header">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center flex items-center justify-center">
          <Droplet className="mr-2 h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:h-8" />
          顧客情報フォーム
        </h1>
      </div>
      <div className="w-full bg-gray-50 min-h-[calc(100vh-5rem)] py-6 md:py-8 lg:py-10">
        <div className="form-container">
          {step <= getTotalSteps() && <ProgressBar currentStep={step} totalSteps={getTotalSteps()} />}
          {error && <ErrorMessage message={error} />}
          <div className="mt-6 md:mt-8 lg:mt-10">{renderStep()}</div>
        </div>
      </div>
    </div>
  )
}
