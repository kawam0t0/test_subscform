"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import type { BaseFormProps } from "../types"
import { SquareSDK, loadSquareScript } from "../utils/square-sdk"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCardReady, setIsCardReady] = useState(false)
  const squareSDKRef = useRef<SquareSDK | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    let paymentsInstance: any = null

    const initializeSquarePayments = async () => {
      try {
        setError(null)
        setIsLoading(true)

        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
        if (!appId) {
          throw new Error("Square App ID が設定されていません")
        }

        await loadSquareScript()

        if (!isMounted) return

        // window.Square が存在するか確認
        if (!window.Square) {
          throw new Error("Square SDK がウィンドウオブジェクトにロードされていません。")
        }

        paymentsInstance = await window.Square.payments(appId)

        if (isMounted) {
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

    initializeSquarePayments()

    return () => {
      isMounted = false
      if (paymentsInstance && typeof paymentsInstance.destroy === "function") {
        try {
          paymentsInstance.destroy()
        } catch (e) {
          console.error("Payments インスタンスの破棄に失敗:", e)
        }
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const attachCardForm = async () => {
      if (!containerRef.current || isLoading || !window.Square || !process.env.NEXT_PUBLIC_SQUARE_APP_ID) {
        return
      }

      try {
        // SquareSDK インスタンスを初期化
        squareSDKRef.current = new SquareSDK(process.env.NEXT_PUBLIC_SQUARE_APP_ID)
        await squareSDKRef.current.initialize()

        if (!isMounted) return

        await squareSDKRef.current.attachCard("card-container")

        if (isMounted) {
          setIsCardReady(true)
        }
      } catch (err) {
        console.error("カードフォームアタッチエラー:", err)
        if (isMounted) {
          setError(`カードフォームアタッチエラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
        }
      }
    }

    if (!isLoading) {
      attachCardForm()
    }

    return () => {
      isMounted = false
      if (squareSDKRef.current) {
        squareSDKRef.current.destroy()
        squareSDKRef.current = null
      }
    }
  }, [isLoading, containerRef.current])

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
        <label htmlFor="card-container" className="form-label flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          クレジットカード情報
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
            <div ref={containerRef} id="card-container" className="min-h-[120px]"></div>
          )}
        </div>

        <p className="mt-2 text-sm text-gray-500"></p>
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
