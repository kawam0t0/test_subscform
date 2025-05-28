"use client"

import type React from "react"
import { FileText, ChevronDown } from "lucide-react"
import type { BaseFormProps } from "../types"

const inquiryTypes = [
  { value: "解約", label: "解約" },
  { value: "その他問い合わせ", label: "その他問い合わせ" },
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
            onChange={(e) => updateFormData({ inquiryType: e.target.value })}
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

      <div>
        <label htmlFor="inquiryDetails" className="form-label flex items-center gap-2">
          <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          詳細内容
        </label>
        <textarea
          id="inquiryDetails"
          value={formData.inquiryDetails || ""}
          onChange={(e) => updateFormData({ inquiryDetails: e.target.value })}
          required
          className="w-full h-40 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="お問い合わせ内容、またはご解約理由を差し支えなければを詳しくご記入下さい"
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
