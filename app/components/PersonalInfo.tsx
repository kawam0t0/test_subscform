"use client"

import type React from "react"
import { User, Mail, Phone, MapPin } from "lucide-react"
import { useState } from "react"
import type { BaseFormProps } from "../types"

const stores = [
  "SPLASH'N'GO!前橋50号店",
  "SPLASH'N'GO!伊勢崎韮塚店",
  "SPLASH'N'GO!高崎棟高店",
  "SPLASH'N'GO!足利緑町店",
  "SPLASH'N'GO!新前橋店",
]

export function PersonalInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: "",
      email: "",
      phone: "",
    }

    // Validate name (full-width katakana)
    if (!/^[ァ-ヶー　]+$/.test(formData.name)) {
      newErrors.name = "お名前は全角カタカナで入力してください。"
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください。"
    }

    // Validate phone number (10 or 11 consecutive digits)
    if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[^\d]/g, ""))) {
      newErrors.phone = "電話番号は10桁または11桁の半角数字で入力してください。"
    }

    setErrors(newErrors)

    if (Object.values(newErrors).every((error) => error === "")) {
      nextStep()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <select
          id="store"
          value={formData.store}
          onChange={(e) => updateFormData({ store: e.target.value })}
          required
          className="form-input pl-10"
        >
          <option value="">選択してください</option>
          {stores.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          id="name"
          type="text"
          placeholder="お名前（全角カタカナ）"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
          className="form-input pl-10"
          pattern="^[ァ-ヶー　]+$"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          id="email"
          type="email"
          placeholder="メールアドレス"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          required
          className="form-input pl-10"
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          id="phone"
          type="tel"
          placeholder="電話番号（半角数字のみ）"
          value={formData.phone}
          onChange={(e) => {
            const onlyNumbers = e.target.value.replace(/[^\d]/g, "")
            updateFormData({ phone: onlyNumbers })
          }}
          required
          className="form-input pl-10"
          pattern="^[0-9]{10,11}$"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>
      <div className="pt-4 flex justify-between">
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

