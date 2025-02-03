import { CheckCircle, MapPin, User, Mail, Phone, Car, Palette, CreditCard } from "react-icons/md"

interface ConfirmationProps {
  formData: any
  prevStep: () => void
  submitForm: () => void
}

interface ConfirmationItemProps {
  icon: JSX.Element
  label: string
  value: string | number | undefined
}

const ConfirmationItem: React.FC<ConfirmationItemProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-gray-700">{value ?? "-"}</p>
      </div>
    </div>
  )
}

// Confirmationコンポーネントを更新
export function Confirmation({ formData, prevStep, submitForm }: ConfirmationProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-16rem)] form-container">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 md:space-y-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary flex items-center justify-center">
            <CheckCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            確認
          </h2>
          <div className="bg-blue-50 p-4 sm:p-6 md:p-8 rounded-2xl shadow-inner space-y-4 md:space-y-6">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <ConfirmationItem icon={<MapPin className="text-primary" />} label="入会店舗" value={formData.store} />
              <ConfirmationItem icon={<User className="text-primary" />} label="お名前" value={formData.name} />
              <ConfirmationItem
                icon={<Mail className="text-primary" />}
                label="メールアドレス"
                value={formData.email}
              />
              <ConfirmationItem icon={<Phone className="text-primary" />} label="電話番号" value={formData.phone} />
              <ConfirmationItem icon={<Car className="text-primary" />} label="現在の車種" value={formData.carModel} />
              <ConfirmationItem
                icon={<Palette className="text-primary" />}
                label="現在の車の色"
                value={formData.carColor}
              />
              {formData.operation === "登録車両変更" && (
                <>
                  <ConfirmationItem
                    icon={<Car className="text-primary" />}
                    label="新しい車種"
                    value={formData.newCarModel}
                  />
                  <ConfirmationItem
                    icon={<Palette className="text-primary" />}
                    label="新しい車の色"
                    value={formData.newCarColor}
                  />
                </>
              )}
              {formData.operation === "入会" && (
                <ConfirmationItem
                  icon={<CreditCard className="text-primary" />}
                  label="選択されたコース"
                  value={formData.course}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t mt-6 md:mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
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

