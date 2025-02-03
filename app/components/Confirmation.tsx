"use client"

import { MapPin, User, Mail, Phone, Car, Palette, CreditCard, CheckCircle } from "lucide-react"
import type React from "react" // Added import for React
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
  <div className="flex items-center gap-4">
    <div className="text-primary">{icon}</div>
    <div className="space-y-1">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-base font-medium text-gray-900">{value}</div>
    </div>
  </div>
)

export function Confirmation({ formData, prevStep, submitForm }: ConfirmationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="w-16 h-16 mx-auto text-primary" />
        <h2 className="text-2xl font-bold text-primary">確認</h2>
      </div>

      <div className="bg-blue-50/80 rounded-2xl p-6 space-y-6">
        <ConfirmationItem icon={<MapPin className="w-6 h-6" />} label="入会店舗" value={formData.store} />
        <ConfirmationItem icon={<User className="w-6 h-6" />} label="お名前" value={formData.name} />
        <ConfirmationItem icon={<Mail className="w-6 h-6" />} label="メールアドレス" value={formData.email} />
        <ConfirmationItem icon={<Phone className="w-6 h-6" />} label="電話番号" value={formData.phone} />

        {formData.operation === "入会" && (
          <>
            <ConfirmationItem icon={<Car className="w-6 h-6" />} label="車種" value={formData.carModel} />
            <ConfirmationItem icon={<Palette className="w-6 h-6" />} label="車の色" value={formData.carColor} />
            <ConfirmationItem
              icon={<CreditCard className="w-6 h-6" />}
              label="選択されたコース"
              value={formData.course}
            />
          </>
        )}

        {formData.operation === "登録車両変更" && (
          <>
            <ConfirmationItem icon={<Car className="w-6 h-6" />} label="新しい車種" value={formData.newCarModel} />
            <ConfirmationItem
              icon={<Palette className="w-6 h-6" />}
              label="新しい車の色"
              value={formData.newCarColor}
            />
          </>
        )}

        {formData.operation === "洗車コース変更" && (
          <>
            <ConfirmationItem
              icon={<CreditCard className="w-6 h-6" />}
              label="現在のコース"
              value={formData.currentCourse}
            />
            <ConfirmationItem
              icon={<CreditCard className="w-6 h-6" />}
              label="新しいコース"
              value={formData.newCourse}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          type="button"
          onClick={prevStep}
          className="w-full h-14 rounded-xl border-2 border-gray-200 text-gray-700 bg-white
                   hover:bg-gray-50 transition-colors duration-200"
        >
          戻る
        </button>
        <button
          onClick={submitForm}
          className="w-full h-14 rounded-xl bg-primary text-white
                   hover:bg-primary/90 transition-colors duration-200"
        >
          送信
        </button>
      </div>
    </div>
  )
}

