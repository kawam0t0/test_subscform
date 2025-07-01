"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import type { BaseFormProps } from "../types"
import { SquareSDK, loadSquareScript } from "../utils/square-sdk"

export function NewPaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCardReady, setIsCardReady] = useState(false)
  const squareSDKRef = useRef<SquareSDK | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const initializeSquare = async () => {
      try {
        setError(null)
        setIsLoading(true)

        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
        if (!appId) {
          throw new Error("Square App ID が設定されていません")
        }

        // Square SDK を読み込み
        await loadSquareScript()

        if (!isMounted) return

        // Square SDK を初期化
        squareSDKRef.current = new SquareSDK(appId)
        await squareSDKRef.current.initialize()

        if (!isMounted) return

        // カードフォームをアタッチ
        await squareSDKRef.current.attachCard("new-card-container")

        if (isMounted) {
          setIsCardReady(true)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Square 初期化エラー:", err)
        if (isMounted) {
          setError(`初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
          setIsLoading(false)
        }
      }
    }

    initializeSquare()

    return () => {
      isMounted = false
      if (squareSDKRef.current) {
        squareSDKRef.current.destroy()
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCardReady || !squareSDKRef.current) {
      setError("カード情報が初期化されていません")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await squareSDKRef.current.tokenizeCard()

      if (result.status === "OK" && result.token) {
        updateFormData({ cardToken: result.token })
        nextStep()
      } else {
        throw new Error(result.errors?.[0]?.message || "カードの処理中にエラーが発生しました")
      }
    } catch (err) {
      console.error("カードトークン化エラー:", err)
      setError(`カード処理エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="new-card-container" className="form-label flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          新しいクレジットカード情報
        </label>

        <div className="mt-2 border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-[120px]">
              <div className="text-center">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full"></div>
                <p className="mt-2 text-sm text-gray-500">カード入力フォームを読み込み中...</p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} id="new-card-container" className="min-h-[120px]"></div>
          )}
        </div>

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
        <button type="submit" disabled={isLoading || !isCardReady} className="btn btn-primary">
          {isLoading ? "処理中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}
