"use client"

import type React from "react"
import { FileText } from "lucide-react"
import type { BaseFormProps } from "../types"

export function OtherInquiryForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="inquiryDetails" className="form-label flex items-center gap-2">
          <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          お問い合わせ内容
        </label>
        <textarea
          id="inquiryDetails"
          value={formData.inquiryDetails || ""}
          onChange={(e) => updateFormData({ inquiryDetails: e.target.value })}
          required
          className="w-full h-40 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="お問い合わせ内容を詳しくご記入ください"
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
