"use client"

import type React from "react"

import { useState } from "react"
import { CreditCard, Calendar, Lock } from "lucide-react"
import type { BaseFormProps } from "../types"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111")
  const [expiry, setExpiry] = useState("12/25")
  const [cvv, setCvv] = useState("123")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCardNumber = (value: string) => {
    // 数字以外を削除
    const numbers = value.replace(/\D/g, "")
    // 4桁ごとにスペースを挿入
    const formatted = numbers.replace(/(\d{4})(?=\d)/g, "$1 ")
    return formatted.substring(0, 19) // 最大16桁+スペース3つ
  }

  const formatExpiry = (value: string) => {
    // 数字以外を削除
    const numbers = value.replace(/\D/g, "")
    // 月/年の形式にフォーマット
    if (numbers.length >= 2) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`
    }
    return numbers
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 簡易バリデーション
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("有効なカード番号を入力してください")
      return
    }

    if (expiry.length < 5) {
      setError("有効な有効期限を入力してください")
      return
    }

    if (cvv.length < 3) {
      setError("有効なセキュリティコードを入力してください")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // モック��ークンを生成
      const mockToken = `mock_card_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

      // 少し遅延を入れてAPIリクエストをシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // フォームデータを更新
      updateFormData({ cardToken: mockToken })

      // 次のステップへ
      nextStep()
    } catch (err) {
      console.error("カード処理エラー:", err)
      setError("カード情報の処理中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="card-number" className="form-label flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          クレジットカード情報
        </label>

        <div className="mt-2 border border-gray-300 rounded-xl p-6 bg-white shadow-sm space-y-4">
          <div>
            <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
              カード番号
            </label>
            <input
              id="card-number"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>有効期限 (月/年)</span>
                </div>
              </label>
              <input
                id="expiry"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  <span>セキュリティコード</span>
                </div>
              </label>
              <input
                id="cvv"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          テスト用カード情報がデフォルトで入力されています。実際のカード情報を入力することもできます。
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="pt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={prevStep} className="btn btn-secondary" disabled={isLoading}>
          戻る
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? "処理中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}
