"use client"

import type React from "react"
import type { BaseFormProps } from "../types"

export function OtherInquiryForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="inquiryDetails" className="block text-lg font-medium text-gray-700 mb-2">
          お問い合わせ内容
        </label>
        <textarea
          id="inquiryDetails"
          value={formData.inquiryDetails || ""}
          onChange={(e) => updateFormData({ inquiryDetails: e.target.value })}
          required
          className="w-full h-40 px-4 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="お問い合わせ内容を詳しくご記入ください"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          戻る
        </button>
        <button
          type="submit"
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90"
        >
          次へ
        </button>
      </div>
    </form>
  )
}

