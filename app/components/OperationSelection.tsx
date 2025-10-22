"use client"

import type React from "react"
import { ChevronDown } from "lucide-react"
import type { BaseFormProps } from "../types"

// すべての問い合わせ内容を定義
const allOperations = [
  { value: "入会", label: "ご入会" },
  { value: "登録車両変更", label: "登録車両変更" },
  { value: "洗車コース変更", label: "洗車コース変更" },
  { value: "クレジットカード情報変更", label: "クレジットカード情報変更" },
  { value: "メールアドレス変更", label: "メールアドレス変更" },
  { value: "各種手続き", label: "各種手続き" },
]

const stores = [
  "SPLASH'N'GO!前橋50号店",
  "SPLASH'N'GO!伊勢崎韮塚店",
  "SPLASH'N'GO!高崎棟高店",
  "SPLASH'N'GO!足利緑町店",
  "SPLASH'N'GO!新前橋店",
  "SPLASH'N'GO!太田新田店",
  "テスト店舗",
]

export function OperationSelection({ formData, updateFormData, nextStep }: BaseFormProps) {
  // すべての店舗で全ての問い合わせ内容を表示するように変更
  const operations = allOperations

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.operation || !formData.store) {
      alert("店舗と問い合わせ内容を選択してください")
      return
    }
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 form-container">
      <div className="space-y-4">
        <label htmlFor="store" className="block text-lg sm:text-xl md:text-2xl font-medium text-gray-900">
          店舗選択
        </label>
        <div className="relative">
          <select
            id="store"
            value={formData.store}
            onChange={(e) => updateFormData({ store: e.target.value })}
            required
            className="w-full h-16 sm:h-20 px-6 text-lg sm:text-xl rounded-2xl border-2 border-gray-200 
                     bg-white shadow-sm transition-all duration-200 
                     hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10
                     appearance-none cursor-pointer"
          >
            <option value="">店舗を選択してください</option>
            {stores.map((store) => (
              <option key={store} value={store} className="py-2">
                {store}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-6 h-6" />
        </div>
      </div>

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
