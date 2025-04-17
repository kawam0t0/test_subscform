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
