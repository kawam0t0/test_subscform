"use client"

import { useState } from "react"
import { MapPin, User, Mail, Phone, Car, Palette, CreditCard, CheckCircle, FileText } from "lucide-react"
import Link from "next/link"
import type React from "react"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAgreed, setIsAgreed] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting || !isAgreed) return
    setIsSubmitting(true)
    try {
      await submitForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="text-center space-y-2">
        <CheckCircle className="w-16 h-16 mx-auto text-primary" />
        <h2 className="text-2xl font-bold text-primary">確認</h2>
      </div>

      <div className="bg-blue-50/80 rounded-2xl p-6 space-y-6">
        <ConfirmationItem icon={<MapPin className="w-6 h-6" />} label="入会店舗" value={formData.store} />
        <ConfirmationItem icon={<User className="w-6 h-6" />} label="姓" value={`${formData.familyName}`} />
        <ConfirmationItem icon={<User className="w-6 h-6" />} label="名" value={formData.givenName} />
        <ConfirmationItem icon={<Mail className="w-6 h-6" />} label="メールアドレス" value={formData.email} />
        {formData.operation === "メールアドレス変更" && (
          <ConfirmationItem
            icon={<Mail className="w-6 h-6" />}
            label="新しいメールアドレス"
            value={formData.newEmail}
          />
        )}
        <ConfirmationItem icon={<Phone className="w-6 h-6" />} label="電話番号" value={formData.phone} />
        <ConfirmationItem icon={<Car className="w-6 h-6" />} label="車種" value={formData.carModel} />
        <ConfirmationItem icon={<Palette className="w-6 h-6" />} label="車の色" value={formData.carColor} />

        {/* ナンバープレートの表示を入会以外の場合のみに制限 */}
        {formData.operation !== "入会" && (
          <ConfirmationItem
            icon={<FileText className="w-6 h-6" />}
            label="ナンバープレート（下4桁）"
            value={formData.licensePlate}
          />
        )}

        {formData.operation === "入会" && (
          <ConfirmationItem
            icon={<CreditCard className="w-6 h-6" />}
            label="選択されたコース"
            value={formData.course}
          />
        )}

        {formData.operation === "登録車両変更" && (
          <>
            <ConfirmationItem icon={<Car className="w-6 h-6" />} label="新しい車種" value={formData.newCarModel} />
            <ConfirmationItem
              icon={<Palette className="w-6 h-6" />}
              label="新しい車の色"
              value={formData.newCarColor}
            />
            <ConfirmationItem
              icon={<FileText className="w-6 h-6" />}
              label="新しいナンバープレート（下4桁）"
              value={formData.newLicensePlate}
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

        {formData.operation === "クレジットカード情報変更" && (
          <ConfirmationItem
            icon={<CreditCard className="w-6 h-6" />}
            label="新しいクレジットカード情報"
            value="登録済み"
          />
        )}

        {formData.operation === "各種手続き" && (
          <ConfirmationItem
            icon={<FileText className="w-6 h-6" />}
            label="お問い合わせ内容"
            value={formData.inquiryDetails || ""}
          />
        )}
      </div>

      <div className="flex items-start space-x-2 mt-6">
        <input
          type="checkbox"
          id="agreement"
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
          className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="agreement" className="text-sm text-gray-700">
          <span>私は</span>
          <Link
            href="https://drive.google.com/file/d/1KMf0TG7SIyCtvYiVZEqh-XEY4Jg5e-Lr/view"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            会員規約
          </Link>
          <span>および</span>
          <Link
            href="https://drive.google.com/file/d/1FASj-HEA44iBE4tgfvAbCpj8sMW2PJqy/view"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            プライバシーポリシー
          </Link>
          <span>を読み、理解し、これらに基づいて利用契約を締結することに同意します。</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="w-full h-14 rounded-xl border-2 border-gray-200 text-gray-700 bg-white
                 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          戻る
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !isAgreed}
          className="w-full h-14 rounded-xl bg-primary text-white
           hover:bg-primary/90 transition-colors duration-200 
           disabled:opacity-50 disabled:cursor-not-allowed
           flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
              送信中...
            </>
          ) : (
            "同意して送信"
          )}
        </button>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="w-full h-14 rounded-xl border-2 border-gray-300 text-gray-600 bg-white
                 hover:bg-gray-50 transition-colors duration-200"
        >
          初めに戻る
        </button>
      </div>
    </div>
  )
}
