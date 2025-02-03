import { MapPin, Mail, Phone, User } from "react-feather"

interface FormData {
  store: string
  name: string
  email: string
  phone: string
}

interface Props {
  stores: string[]
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: { [key: string]: string }
  prevStep: () => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void // Added handleSubmit type
}

const PersonalInfo: React.FC<Props> = ({ stores, formData, updateFormData, errors, prevStep, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="form-grid">
        <div>
          <label htmlFor="store" className="select-label">
            <MapPin className="h-5 w-5" />
            入会店舗
          </label>
          <div className="select-wrapper">
            <select
              id="store"
              value={formData.store}
              onChange={(e) => updateFormData({ store: e.target.value })}
              required
              className="custom-select"
            >
              <option value="">選択してください</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="form-label flex items-center gap-2">
            <User className="h-5 w-5" />
            お名前
          </label>
          <input
            id="name"
            type="text"
            placeholder="全角カタカナ"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            required
            className="form-input"
            pattern="^[ァ-ヶー　]+$"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="form-label flex items-center gap-2">
            <Mail className="h-5 w-5" />
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            placeholder="例：example@email.com"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            required
            className="form-input"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="form-label flex items-center gap-2">
            <Phone className="h-5 w-5" />
            電話番号
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="半角数字のみ"
            value={formData.phone}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/[^\d]/g, "")
              updateFormData({ phone: onlyNumbers })
            }}
            required
            className="form-input"
            pattern="^[0-9]{10,11}$"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
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

export default PersonalInfo

