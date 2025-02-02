import type React from "react"
import type { ConfirmationProps } from "../types"
import { CheckCircle, User, Mail, Phone, Car, Palette, CreditCard, MapPin } from "lucide-react"

export function Confirmation({ formData, prevStep, submitForm }: ConfirmationProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-16rem)]">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="w-full max-w-[280px] mx-auto space-y-6 pb-24">
          <h2 className="text-2xl font-semibold text-primary flex items-center justify-center mb-6">
            <CheckCircle className="mr-2" />
            確認
          </h2>
          <div className="bg-blue-50 p-6 rounded-2xl shadow-inner space-y-4">
            <div className="grid gap-4">
              <ConfirmationItem icon={<MapPin className="text-primary" />} label="入会店舗" value={formData.store} />
              <ConfirmationItem icon={<User className="text-primary" />} label="お名前" value={formData.name} />
              <ConfirmationItem
                icon={<Mail className="text-primary" />}
                label="メールアドレス"
                value={formData.email}
              />
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
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="w-full max-w-[280px] mx-auto grid grid-cols-2 gap-3">
          <button type="button" onClick={prevStep} className="btn btn-secondary">
            戻る
          </button>
          <button type="button" onClick={submitForm} className="btn btn-primary">
            送信
          </button>
        </div>
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
        <p className="text-sm text-gray-900 break-all">{value}</p>
      </div>
    </div>
  )
}

