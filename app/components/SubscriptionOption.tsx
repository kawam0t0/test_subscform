"use client"

import type React from "react"
import { CreditCard, Calendar, AlertCircle } from "lucide-react"
import type { BaseFormProps } from "../types"

export function SubscriptionOption({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  // コース名と価格を抽出
  const courseName = formData.course.split("（")[0].trim()
  const coursePrice = formData.course.includes("980円")
    ? "980"
    : formData.course.includes("1280円")
      ? "1280"
      : formData.course.includes("1480円")
        ? "1480"
        : formData.course.includes("2980円")
          ? "2980"
          : "0"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">お支払い方法の選択</h2>
        <p className="text-gray-600 mt-2">ご希望のお支払い方法をお選びください</p>
      </div>

      <div className="space-y-4">
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
            !formData.enableSubscription ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50"
          }`}
          onClick={() => updateFormData({ enableSubscription: false })}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <CreditCard className={`w-6 h-6 ${!formData.enableSubscription ? "text-primary" : "text-gray-400"}`} />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${!formData.enableSubscription ? "text-primary" : "text-gray-700"}`}>
                通常支払い（来店時決済）
              </h3>
              <p className="text-gray-500 mt-1">
                クレジットカードを登録するだけで、店舗での洗車時に自動的に決済されます。
              </p>
            </div>
          </div>
        </div>

        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
            formData.enableSubscription ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50"
          }`}
          onClick={() => updateFormData({ enableSubscription: true })}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <Calendar className={`w-6 h-6 ${formData.enableSubscription ? "text-primary" : "text-gray-400"}`} />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${formData.enableSubscription ? "text-primary" : "text-gray-700"}`}>
                定期支払い（月額自動引き落とし）
              </h3>
              <p className="text-gray-500 mt-1">
                毎月自動的にクレジットカードから料金が引き落とされます。来店の有無に関わらず料金が発生します。
              </p>
              {formData.enableSubscription && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 font-medium">月額料金のご案内</p>
                      <p className="text-sm text-blue-600 mt-1">
                        選択されたコース「{courseName}」の月額料金 {coursePrice}円が毎月自動的に引き落とされます。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          戻る
        </button>
        <button type="submit" className="btn btn-primary">
          次へ
        </button>
      </div>
    </form>
  )
}
