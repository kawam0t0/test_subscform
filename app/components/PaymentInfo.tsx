"use client"

import { useEffect, useState, useRef } from "react"
import { loadSquareSdk } from "../utils/square-sdk"
import type { BaseFormProps } from "../types"
import type React from "react" // Added import for React

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

  // 残りのコンポーネントのレンダリングコード...
}

