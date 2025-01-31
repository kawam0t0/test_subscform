import type React from "react"
import type { ConfirmationProps } from "../types"
import { CheckCircle, User, Mail, Phone, Car, Palette, CreditCard, MapPin } from "lucide-react"

export function Confirmation({ formData, prevStep, submitForm }: ConfirmationProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary flex items-center justify-center">
        <CheckCircle className="mr-2" />
        確認
      </h2>
      <div className="bg-blue-50 p-6 rounded-lg shadow-inner">
        <div className="grid grid-cols-1 gap-4">
          <ConfirmationItem icon={<MapPin />} label="入会店舗" value={formData.store} />
          <ConfirmationItem icon={<User />} label="お名前" value={formData.name} />
          <ConfirmationItem icon={<Mail />} label="メールアドレス" value={formData.email} />
          <ConfirmationItem icon={<Phone />} label="電話番号" value={formData.phone} />
          <ConfirmationItem icon={<Car />} label="車種" value={formData.carModel} />
          <ConfirmationItem icon={<Palette />} label="車の色" value={formData.carColor} />
          <ConfirmationItem icon={<CreditCard />} label="選択されたコース" value={formData.course} />
        </div>
      </div>
      <div className="pt-4 flex justify-between">
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
    <div className="flex items-center space-x-2">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  )
}

