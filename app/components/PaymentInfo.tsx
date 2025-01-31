"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { loadSquareSdk } from "../utils/square-sdk"
import { CreditCard, ArrowLeft, AlertCircle } from "lucide-react"
import type { BaseFormProps } from "../types"

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
        if (!cardContainerRef.current) {
          throw new Error("カード情報入力フォームが見つかりません")
        }

        const payments = await loadSquareSdk()
        if (!payments || !isMounted) return

        console.log("カード支払いフォームを作成中...")
        const card = await payments.card()
        await card.attach(cardContainerRef.current)
        console.log("カード支払いフォームが正常に作成されました")
        setCard(card)
        setIsLoading(false)
      } catch (error) {
        console.error("Square SDKの読み込みに失敗しました:", error)
        if (isMounted) {
          // エラーメッセージを日本語化
          const errorMessage = error instanceof Error ? error.message : "支払いフォームの読み込みに失敗しました"
          if (errorMessage.includes("credentials are not properly configured")) {
            setError("Square認証情報が正しく設定されていません。管理者に連絡してください。")
          } else {
            setError(errorMessage)
          }
          setIsLoading(false)
        }
      }
    }

    if (cardContainerRef.current) {
      initializeSquare()
    }

    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium mb-1">エラーが発生しました</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <div className="flex justify-between">
          <button type="button" onClick={prevStep} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            前の画面に戻る
          </button>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
            再読み込み
          </button>
        </div>
      </div>
    )
  }

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
        setError("カード情報の処理に失敗しました")
        console.error("カードのトークン化に失敗しました:", result.errors)
      }
    } catch (error) {
      console.error("カードのトークン化中にエラーが発生しました:", error)
      setError("カードの処理中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

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
      <div className="pt-4 flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          前の画面に戻る
        </button>
        <button type="submit" disabled={isLoading || !card} className="btn btn-primary">
          {isLoading ? "読み込み中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}

