"use client"

import { useEffect, useState, useRef } from "react"
import { CreditCard } from "lucide-react"
import { loadSquareSdk } from "../utils/square-sdk"
import type { BaseFormProps } from "../types"
import type React from "react"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [card, setCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
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

      <div className="pt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          戻る
        </button>
        <button type="submit" disabled={isLoading || !card} className="btn btn-primary">
          {isLoading ? "処理中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}

