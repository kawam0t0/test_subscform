"use client"

import { CreditCard } from "lucide-react"
import type React from "react" // Import React
import type { FormData } from "../types"

interface ConfirmationProps {
  formData: FormData
  prevStep: () => void
  submitForm: () => void
}

interface ConfirmationItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

const ConfirmationItem = ({ icon, label, value }: ConfirmationItemProps) => (
  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
    <div className="text-primary">{icon}</div>
    <div className="space-y-1">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-gray-600">{value}</p>
    </div>
  </div>
)

export function Confirmation({ formData, prevStep, submitForm }: ConfirmationProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">確認画面</h2>
      <div className="space-y-4">
        <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="店舗" value={formData.store} />
        <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="お名前" value={formData.name} />
        <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="メールアドレス" value={formData.email} />
        <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="電話番号" value={formData.phone} />

        {formData.operation === "入会" && (
          <>
            <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="車種" value={formData.carModel} />
            <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="車の色" value={formData.carColor} />
            <ConfirmationItem icon={<CreditCard className="h-5 w-5" />} label="選択コース" value={formData.course} />
          </>
        )}

        {formData.operation === "登録車両変更" && (
          <>
            <ConfirmationItem
              icon={<CreditCard className="h-5 w-5" />}
              label="新しい車種"
              value={formData.newCarModel}
            />
            <ConfirmationItem
              icon={<CreditCard className="h-5 w-5" />}
              label="新しい車の色"
              value={formData.newCarColor}
            />
          </>
        )}

        {formData.operation === "洗車コース変更" && (
          <>
            <ConfirmationItem
              icon={<CreditCard className="h-5 w-5" />}
              label="現在のコース"
              value={formData.currentCourse}
            />
            <ConfirmationItem
              icon={<CreditCard className="h-5 w-5" />}
              label="新しいコース"
              value={formData.newCourse}
            />
          </>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          戻る
        </button>
        <button type="button" onClick={submitForm} className="btn btn-primary">
          送信
        </button>
      </div>
    </div>
  )
}

