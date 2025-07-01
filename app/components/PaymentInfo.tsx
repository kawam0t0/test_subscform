"use client"

import React from "react"
import { useState } from "react"
import { CreditCard, Camera } from "lucide-react"
import { loadSquareSdk } from "../utils/square-sdk"
import type { BaseFormProps } from "../types"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [card, setCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isCameraSupported, setIsCameraSupported] = useState(false)
  const cardContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let isMounted = true

    const initializeSquare = async () => {
      try {
        setError(null)
        console.log("Square初期化を開始します")

        if (!cardContainerRef.current) {
          throw new Error("カードコンテナが見つかりません")
        }

        const payments = await loadSquareSdk()
        if (!payments || !isMounted) return

        console.log("Square SDKが正常に読み込まれました。カードを初期化します")

        // カメラ機能を有効化したカード設定
        const card = await payments.card({
          style: {
            input: {
              fontSize: "16px",
              color: "#374151",
              backgroundColor: "#ffffff",
            },
            "input::placeholder": {
              color: "#9CA3AF",
            },
            ".input-container": {
              borderColor: "#E5E7EB",
              borderWidth: "1px",
              borderRadius: "0.5rem",
              padding: "0.75rem",
            },
            ".input-container.is-focus": {
              borderColor: "#3B82F6",
              boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.25)",
            },
          },
          // カメラ読み取り機能を有効化
          includeInputLabels: true,
          cardNumber: {
            elementId: "card-number",
            placeholder: "カード番号またはカメラでスキャン",
            // カメラスキャナーアイコンを表示
            showCardScannerIcon: true,
          },
          expirationDate: {
            elementId: "expiration-date",
            placeholder: "MM/YY",
          },
          cvv: {
            elementId: "cvv",
            placeholder: "CVV",
          },
        })

        await card.attach(cardContainerRef.current)

        // カメラサポートの確認
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          setIsCameraSupported(true)
        }

        if (isMounted) {
          setCard(card)
          setIsLoading(false)
          console.log("カードが正常に初期化されました（カメラ機能付き）")
        }
      } catch (error) {
        console.error("支払い初期化エラー:", error)
        if (error instanceof Error) {
          setError(`初期化エラー: ${error.message}`)
        } else {
          setError("支払いフォームの初期化中に不明なエラーが発生しました")
        }
        setIsLoading(false)
      }
    }

    initializeSquare()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card) return

    try {
      setIsLoading(true)
      setError(null)
      const result = await card.tokenize()
      if (result.status === "OK") {
        updateFormData({ cardToken: result.token })
        nextStep()
      } else {
        throw new Error(result.errors[0].message)
      }
    } catch (error) {
      console.error("カードの処理中にエラーが発生しました:", error)
      setError("カードの処理中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="card-container" className="form-label flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          クレジットカード情報
          {isCameraSupported && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Camera className="h-4 w-4" />
              <span>カメラ読み取り対応</span>
            </div>
          )}
        </label>

        <div
          className={`card-input-wrapper ${isFocused ? "focused" : ""}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-[120px]">
              <div className="text-center">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full"></div>
                <p className="mt-2 text-sm text-gray-500">カード入力フォームを読み込み中...</p>
              </div>
            </div>
          ) : (
            <div ref={cardContainerRef} id="card-container" className="min-h-[120px]" />
          )}
        </div>

        {isCameraSupported && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <Camera className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700 font-medium">カメラでカード読み取り</p>
                <p className="text-sm text-blue-600 mt-1">
                  カード番号入力欄のカメラアイコンをタップして、クレジットカードをスキャンできます。
                  カード番号と有効期限が自動で入力されます。
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-2 text-sm text-gray-500">
          テスト用カード番号: 4111 1111 1111 1111（有効期限は未来の日付、CVVは任意の3桁）
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          戻る
        </button>
        <button
          type="submit"
          disabled={isLoading || !card}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90"
        >
          {isLoading ? "処理中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}
