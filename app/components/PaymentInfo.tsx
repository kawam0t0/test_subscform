"use client"

import { useEffect, useState, useRef } from "react"
import { CreditCard, ArrowLeft, AlertCircle } from "lucide-react"
import { loadSquareSdk } from "../utils/square-sdk"
import type { BaseFormProps } from "../types"
import type React from "react"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [card, setCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const initializeSquare = async () => {
      try {
        setError(null)
        console.log("Starting Square initialization in component")

        if (!cardContainerRef.current) {
          throw new Error("Card container not found")
        }

        const payments = await loadSquareSdk()
        if (!payments || !isMounted) return

        console.log("Square SDK loaded successfully, initializing card")
        const card = await payments.card()
        await card.attach(cardContainerRef.current)

        if (isMounted) {
          setCard(card)
          setIsLoading(false)
          console.log("Card initialized successfully")
        }
      } catch (error) {
        console.error("Payment initialization error:", error)
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
      console.log("Tokenizing card...")
      const result = await card.tokenize()
      if (result.status === "OK") {
        console.log("Card tokenized successfully")

        // サーバーに顧客情報とカードトークンを送信
        const response = await fetch("/api/create-customer-and-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            cardNonce: result.token,
          }),
        })

        const data = await response.json()

        if (data.success) {
          console.log("Customer and card created successfully")
          updateFormData({ cardToken: data.cardId })
          nextStep()
        } else {
          throw new Error(data.error || "顧客とカード情報の保存に失敗しました")
        }
      } else {
        setError("カード情報の処理に失敗しました")
        console.error("カードのトークン化に失敗しました:", result.errors)
      }
    } catch (error) {
      console.error("カードの処理中にエラーが発生しました:", error)
      setError("カードの処理中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // コンポーネントのレンダリング部分を追加
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="card-container" className="form-label">
          クレジットカード情報
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 text-gray-400" />
          <div
            ref={cardContainerRef}
            id="card-container"
            className="mt-1 p-3 pl-10 bg-white border rounded-md min-h-[100px]"
          />
        </div>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium mb-1">エラーが発生しました</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      <div className="pt-4 flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          前の画面に戻る
        </button>
        <button type="submit" disabled={isLoading || !card} className="btn btn-primary">
          {isLoading ? "処理中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}

