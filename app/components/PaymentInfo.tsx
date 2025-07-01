"use client"

import React from "react"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { loadSquareSdk } from "../utils/square-sdk"
import type { BaseFormProps } from "../types"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [card, setCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
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
        const card = await payments.card({
          style: {
            input: {
              fontSize: "16px",
              color: "#374151",
            },
            "input::placeholder": {
              color: "#9CA3AF",
            },
          },
        })
        await card.attach(cardContainerRef.current)

        if (isMounted) {
          setCard(card)
          setIsLoading(false)
          console.log("カードが正常に初期化されました")
        }
      } catch (error) {
        console.error("支払い初期化エラー:", error)
        if (error instanceof Error) {
          setError(`初期化エラー: ${error.message}`)
        } else {
          setError("支払いフォームの初期化中に不明なエラーが発生しまた")
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
        </label>
        <div
          className={`card-input-wrapper ${isFocused ? "focused" : ""}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <div ref={cardContainerRef} id="card-container" className="min-h-[44px]" />
        </div>
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