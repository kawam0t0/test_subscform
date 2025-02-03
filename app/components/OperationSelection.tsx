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
    // 入会、登録車両変更、洗車コース変更、クレジットカード情報変更の場合は次のステップへ進む
    if (["入会", "登録車両変更", "洗車コース変更", "クレジットカード情報変更"].includes(formData.operation)) {
      nextStep()
    } else {
      // その他の操作の場合はAppSheetへ遷移
      window.location.href = APPSHEET_URL
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 form-container">
      <div className="space-y-4">
        <label htmlFor="operation" className="block text-lg sm:text-xl md:text-2xl font-medium text-gray-900">
          問い合わせ内容
        </label>
        <div className="relative">
          <select
            id="operation"
            value={formData.operation}
            onChange={(e) => updateFormData({ operation: e.target.value })}
            required
            className="w-full h-16 sm:h-20 px-6 text-lg sm:text-xl rounded-2xl border-2 border-gray-200 
                     bg-white shadow-sm transition-all duration-200 
                     hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10
                     appearance-none cursor-pointer"
          >
            <option value="">選択してください</option>
            {operations.map((op) => (
              <option key={op.value} value={op.value} className="py-2">
                {op.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-6 h-6" />
        </div>
      </div>
      <div className="pt-8">
        <button
          type="submit"
          className="w-full h-16 sm:h-20 text-lg sm:text-xl font-medium rounded-2xl bg-primary 
                   text-white shadow-lg transition-all duration-200 
                   hover:bg-primary/90 hover:shadow-xl active:transform active:scale-[0.98]"
        >
          次へ
        </button>
      </div>
    </form>
  )
}

