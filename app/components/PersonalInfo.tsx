"use client"

import type React from "react"
import { User, Mail, Phone, Camera } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import type { BaseFormProps } from "../types"
import { BarcodeScanner } from "./BarcodeScanner"

export function PersonalInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [errors, setErrors] = useState({
    familyName: "",
    givenName: "",
    email: "",
    phone: "",
    membershipNumber: "",
  })
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = {
      familyName: "",
      givenName: "",
      email: "",
      phone: "",
      membershipNumber: "",
    }

    if (!/^[ァ-ヶー　]+$/.test(formData.familyName)) {
      newErrors.familyName = "姓は全角カタカナで入力してください。"
    }

    if (!/^[ァ-ヶー　]+$/.test(formData.givenName)) {
      newErrors.givenName = "名は全角カタカナで入力してください。"
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください。"
    }

    if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[^\d]/g, ""))) {
      newErrors.phone = "電話番号は10桁または11桁の半角数字で入力してください。"
    }

    // 会員番号のバリデーション（入会以外の場合のみ）
    if (formData.operation !== "入会" && formData.membershipNumber) {
      if (!/^[a-zA-Z0-9]+$/.test(formData.membershipNumber)) {
        newErrors.membershipNumber = "会員番号は半角英数字で入力してください。"
      }
    }

    setErrors(newErrors)

    if (Object.values(newErrors).every((error) => error === "")) {
      nextStep()
    }
  }

  // バーコードスキャン結果を処理
  const handleScanResult = (result: string) => {
    console.log("スキャン結果:", result)
    // スキャン結果をクリーンアップ（英数字のみ抽出）
    const cleanResult = result.replace(/[^a-zA-Z0-9]/g, "")
    updateFormData({ membershipNumber: cleanResult })
    setIsScannerOpen(false)
  }

  // バーコードリーダー起動
  const handleBarcodeScan = () => {
    setIsScannerOpen(true)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="form-section">
        {/* 入会の場合のみNG車両画像を表示 */}
        {formData.operation === "入会" && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Image
                src="/images/ng-vehicles.png"
                alt="NG車両（洗車対応ができない車両）"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              上記の車両は洗車サービスをご利用いただけません。ご確認の上、お申し込みください。
            </p>
          </div>
        )}

        <div className="form-grid">
          {/* 会員番号の入力項目（入会以外の場合のみ表示） */}
          {formData.operation !== "入会" && (
            <div>
              <label htmlFor="membershipNumber" className="form-label flex items-center gap-2">
                <User className="h-6 w-6" />
                会員番号
              </label>
              <div className="relative flex items-center">
                <input
                  id="membershipNumber"
                  type="text"
                  placeholder="半角英数字"
                  value={formData.membershipNumber || ""}
                  onChange={(e) => updateFormData({ membershipNumber: e.target.value })}
                  required
                  className="form-input pr-12"
                />
                <button
                  type="button"
                  onClick={handleBarcodeScan}
                  className="absolute right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="バーコードをスキャン"
                >
                  <Camera className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {errors.membershipNumber && <p className="text-red-500 text-sm mt-2">{errors.membershipNumber}</p>}
            </div>
          )}

          <div>
            <label htmlFor="familyName" className="form-label flex items-center gap-2">
              <User className="h-6 w-6" />姓
            </label>
            <input
              id="familyName"
              type="text"
              placeholder="全角カタカナ"
              value={formData.familyName}
              onChange={(e) => updateFormData({ familyName: e.target.value })}
              required
              className="form-input"
            />
            {errors.familyName && <p className="text-red-500 text-sm mt-2">{errors.familyName}</p>}
          </div>

          <div>
            <label htmlFor="givenName" className="form-label flex items-center gap-2">
              <User className="h-6 w-6" />名
            </label>
            <input
              id="givenName"
              type="text"
              placeholder="全角カタカナ"
              value={formData.givenName}
              onChange={(e) => updateFormData({ givenName: e.target.value })}
              required
              className="form-input"
            />
            {errors.givenName && <p className="text-red-500 text-sm mt-2">{errors.givenName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="form-label flex items-center gap-2">
              <Mail className="h-6 w-6" />
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
            {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="form-label flex items-center gap-2">
              <Phone className="h-6 w-6" />
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
            />
            {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone}</p>}
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

      {/* バーコードスキャナーモーダル */}
      <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScanResult} />
    </>
  )
}
