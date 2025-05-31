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
import { BasicCardInput } from "./BasicCardInput"
import { OtherInquiryForm } from "./OtherInquiryForm"
import { NewVehicleInfo } from "./NewVehicleInfo"
import { EmailChangeForm } from "./EmailChangeForm"
import { SubscriptionOption } from "./SubscriptionOption"
import type { FormData } from "../types"
// 既存のインポートに追加
import { getPlanIdFromCourseName, getLocationIdFromStoreName } from "../utils/subscription-plans"

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

      // 入会で定期請求が有効な場合、サブスクリプションを作成
      if (formData.operation === "入会" && formData.enableSubscription && data.customerId) {
        try {
          // 店舗名からLocationIDを取得
          const locationId = getLocationIdFromStoreName(formData.store)
          // コース名からプランIDを取得
          const planId = getPlanIdFromCourseName(formData.course)

          if (!planId) {
            console.error("サブスクリプションプランが見つかりません:", formData.course)
            // エラーログを出力するだけで処理は続行
          } else {
            console.log("サブスクリプション作成リクエスト:", {
              customerId: data.customerId,
              locationId: locationId,
              planId: planId,
              cardToken: formData.cardToken, // カードトークンを追加
            })

            const subscriptionResponse = await fetch("/api/create-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: data.customerId,
                locationId: locationId,
                planId: planId,
                cardToken: formData.cardToken, // カードトークンを追加
              }),
            })

            const subscriptionData = await subscriptionResponse.json()
            console.log("サブスクリプションAPIレスポンス:", subscriptionData)

            if (!subscriptionResponse.ok) {
              console.error("サブスクリプション作成エラー:", subscriptionData.error)
              // サブスクリプション作成エラーは全体の処理を中断しない
            }
          }
        } catch (subscriptionError) {
          console.error("サブスクリプション作成中にエラーが発生:", subscriptionError)
          // サブスクリプション作成エラーは全体の処理を中断しない
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
      throw error // エラーを再スローして、Confirmationコンポーネントでキャッチできるようにする
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
        // 入会フロー
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
              <SubscriptionOption
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 6:
            return (
              <BasicCardInput // 新しいBasicCardInputコンポーネントを使用
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 7:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 8:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      // 他の操作タイプの処理
      case "登録車両変更":
        // 登録車両変更フロー
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
          case 7:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "クレジットカード情報変更":
        // クレジットカード情報変更フロー
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
              <BasicCardInput // 新しいBasicCardInputコンポーネントを使用
                formData={formData}
                updateFormData={updateFormData}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )
          case 5:
            return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
          case 7:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "メールアドレス変更":
        // メールアドレス変更フロー
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
          case 7:
            return <ThankYou formData={formData} />
          default:
            return null
        }

      case "各種手続き":
        // 各種手続きフロー
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
          case 7:
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
        return 7 // 定期請求オプションのステップを追加
      case "登録車両変更":
      case "洗車コース変更":
      case "クレジットカード情報変更":
      case "メールアドレス変更":
      case "各種手続き":
        return 5 // OperationSelection → PersonalInfo → VehicleInfo → 専用フォーム → Confirmation
      default:
        return 7 // デフォルト
    }
  }

  // 店舗名からLocationIDを取得する関数を追加
  function getLocationIdFromStoreName(storeName: string): string {
    const locationMap: { [key: string]: string } = {
      "SPLASH'N'GO!前橋50号店": "L49BHVHTKTQPE",
      "SPLASH'N'GO!伊勢崎韮塚店": "LEFYQ66VK7C0H",
      "SPLASH'N'GO!高崎棟高店": "LDHMQX9VPW34B",
      "SPLASH'N'GO!足利緑町店": "LV19VY3VYHPBA",
      "SPLASH'N'GO!新前橋店": "LPK3Z9BHEEXX3",
    }
    return locationMap[storeName] || ""
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
          {step < 8 && <ProgressBar currentStep={step} totalSteps={getTotalSteps()} />}
          {error && <ErrorMessage message={error} />}
          <div className="mt-6 md:mt-8 lg:mt-10">{renderStep()}</div>
        </div>
      </div>
    </div>
  )
}
