import type React from "react"
import type { ConfirmationProps } from "../types"
import { CheckCircle, User, Mail, Phone, Car, Palette, CreditCard, MapPin } from "lucide-react"

export function Confirmation({ formData, prevStep, submitForm }: ConfirmationProps) {
  return (
    <div className="confirmation-container">
      <h2 className="text-2xl font-semibold text-primary flex items-center justify-center mb-6">
        <CheckCircle className="mr-2" />
        確認
      </h2>
      <div className="confirmation-content">
        <div className="grid gap-4">
          <ConfirmationItem icon={<MapPin className="text-primary" />} label="入会店舗" value={formData.store} />
          <ConfirmationItem icon={<User className="text-primary" />} label="お名前" value={formData.name} />
          <ConfirmationItem icon={<Mail className="text-primary" />} label="メールアドレス" value={formData.email} />
          <ConfirmationItem icon={<Phone className="text-primary" />} label="電話番号" value={formData.phone} />
          <ConfirmationItem icon={<Car className="text-primary" />} label="車種" value={formData.carModel} />
          <ConfirmationItem icon={<Palette className="text-primary" />} label="車の色" value={formData.carColor} />
          <ConfirmationItem
            icon={<CreditCard className="text-primary" />}
            label="選択されたコース"
            value={formData.course}
          />
        </div>
      </div>
      <div className="confirmation-buttons">
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

function ConfirmationItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0 w-5 h-5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}

