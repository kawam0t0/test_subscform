"use client"

import type React from "react"
import { ChevronDown } from "lucide-react"
import type { BaseFormProps } from "../types"

const operations = [
  { value: "入会", label: "ご入会" },
  { value: "登録車両変更", label: "登録車両変更" },
  { value: "洗車コース変更", label: "洗車コース変更" },
  { value: "クレジットカード情報変更", label: "クレジットカード情報変更" },
  { value: "その他", label: "その他" },
]

const APPSHEET_URL = "https://www.appsheet.com/start/0af1bf9f-5cc8-4be2-a73c-26d0e76ac42d"

export function OperationSelection({ formData, updateFormData, nextStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.operation) {
      alert("操作を選択してください")
      return
    }
    // 入会の場合のみ次のステップへ進む
    if (formData.operation === "入会") {
      nextStep()
    } else {
      window.location.href = APPSHEET_URL
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full px-6">
      <div>
        <label htmlFor="operation" className="form-label">
          問い合わせ内容
        </label>
        <div className="relative">
          <select
            id="operation"
            value={formData.operation}
            onChange={(e) => updateFormData({ operation: e.target.value })}
            required
            className="form-input appearance-none"
          >
            <option value="">選択してください</option>
            {operations.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="pt-4">
        <button type="submit" className="btn btn-primary w-full">
          次へ
        </button>
      </div>
    </form>
  )
}

