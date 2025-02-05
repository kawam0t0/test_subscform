"use client"

import type React from "react"
import { Mail } from "lucide-react"
import type { BaseFormProps } from "../types"

export function EmailChangeForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="newEmail" className="form-label flex items-center gap-2">
          <Mail className="h-5 w-5" />
          新しいメールアドレス
        </label>
        <input
          id="newEmail"
          type="email"
          placeholder="例：new-email@example.com"
          value={formData.newEmail}
          onChange={(e) => updateFormData({ newEmail: e.target.value })}
          required
          className="form-input"
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

