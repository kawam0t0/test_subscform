"use client"

import type React from "react"
import { FileText, ChevronDown } from "lucide-react"
import type { BaseFormProps } from "../types"

const inquiryTypes = [
  { value: "解約", label: "解約" },
  { value: "その他問い合わせ", label: "その他問い合わせ" },
]

const cancellationReasons = [
  "利用頻度が減った",
  "スタッフの接客が良くなかった",
  "サービスに不満を感じている",
  "当店の利用が難しくなった",
]

export function OtherInquiryForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.inquiryType) {
      alert("お問い合わせの種類を選択してください")
      return
    }
    nextStep()
  }

  const handleInquiryTypeChange = (value: string) => {
    updateFormData({
      inquiryType: value,
      // 解約以外を選択した場合は解約理由をクリア
      cancellationReasons: value === "解約" ? formData.cancellationReasons : [],
    })
  }

  const handleCancellationReasonChange = (reason: string, checked: boolean) => {
    const currentReasons = formData.cancellationReasons || []
    let newReasons: string[]

    if (checked) {
      newReasons = [...currentReasons, reason]
    } else {
      newReasons = currentReasons.filter((r) => r !== reason)
    }

    updateFormData({ cancellationReasons: newReasons })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="inquiryType" className="form-label flex items-center gap-2">
          <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          お問い合わせの種類
        </label>
        <div className="relative">
          <select
            id="inquiryType"
            value={formData.inquiryType || ""}
            onChange={(e) => handleInquiryTypeChange(e.target.value)}
            required
            className="w-full h-16 sm:h-20 px-6 text-lg sm:text-xl rounded-2xl border-2 border-gray-200 
                     bg-white shadow-sm transition-all duration-200 
                     hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10
                     appearance-none cursor-pointer"
          >
            <option value="">選択してください</option>
            {inquiryTypes.map((type) => (
              <option key={type.value} value={type.value} className="py-2">
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-6 h-6" />
        </div>
      </div>

      {/* 解約理由のチェックリスト（解約を選択した場合のみ表示） */}
      {formData.inquiryType === "解約" && (
        <div>
          <label className="form-label flex items-center gap-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
            解約理由（複数選択可）
          </label>
          <div className="space-y-3 mt-2">
            {cancellationReasons.map((reason) => (
              <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.cancellationReasons || []).includes(reason)}
                  onChange={(e) => handleCancellationReasonChange(reason, e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-base text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="inquiryDetails" className="form-label flex items-center gap-2">
          <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          {formData.inquiryType === "解約" ? "その他ご意見・ご要望" : "詳細内容"}
        </label>
        <textarea
          id="inquiryDetails"
          value={formData.inquiryDetails || ""}
          onChange={(e) => updateFormData({ inquiryDetails: e.target.value })}
          required={formData.inquiryType !== "解約"} // 解約の場合は任意入力
          className="w-full h-40 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder={
            formData.inquiryType === "解約"
              ? "その他ご意見やご要望がございましたらご記入ください（任意）"
              : "お問い合わせ内容を詳しくご記入ください"
          }
        />
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
