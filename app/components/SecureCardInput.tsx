"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import type { BaseFormProps } from "../types"

export function SecureCardInput({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isCardReady, setIsCardReady] = useState(false)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const cardInstanceRef = useRef<any>(null)

  // 開発環境かどうかを判定
  const isDev = process.env.NODE_ENV === "development"

  // コンポーネントがマウントされたことを確認
  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
      // クリーンアップ時にカードインスタンスを破棄
      if (cardInstanceRef.current && typeof cardInstanceRef.current.destroy === "function") {
        try {
          cardInstanceRef.current.destroy()
        } catch (e) {
          console.error("カードインスタンスの破棄に失敗:", e)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!isMounted || !cardContainerRef.current) return

    let paymentsInstance: any = null

    const initializeSquare = async () => {
      try {
        setError(null)
        setIsLoading(true)

        // 開発環境ではモックUIを表示
        if (isDev) {
          console.log("開発環境: モックカードUIを表示")

          // モックUIを作成
          if (cardContainerRef.current) {
            // 既存の子要素をクリア
            while (cardContainerRef.current.firstChild) {
              cardContainerRef.current.removeChild(cardContainerRef.current.firstChild)
            }

            const mockContainer = document.createElement("div")
            mockContainer.className = "mock-card-container p-4"
            mockContainer.innerHTML = `
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">カード番号</label>
                <input type="text" value="4111 1111 1111 1111" readonly class="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
              </div>
              <div class="flex space-x-4">
                <div class="w-1/2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">有効期限</label>
                  <input type="text" value="12/25" readonly class="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                </div>
                <div class="w-1/2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input type="text" value="123" readonly class="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                </div>
              </div>
            `

            cardContainerRef.current.appendChild(mockContainer)

            // モックカードインスタンスを作成
            cardInstanceRef.current = {
              tokenize: async () => ({
                status: "OK",
                token: `mock_card_${Date.now()}`,
              }),
            }

            setIsCardReady(true)
            setIsLoading(false)
          }

          return
        }

        // 本番環境: Square SDKを使用
        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID

        if (!appId) {
          throw new Error("Square App IDが設定されていません")
        }

        let attempts = 0
        const maxAttempts = 50

        while (!window.Square && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          attempts++
        }

        if (!window.Square) {
          throw new Error("Square SDK failed to load")
        }

        // Squareの支払い機能を初期化
        paymentsInstance = await window.Square.payments(appId)

        if (!isMounted || !cardContainerRef.current) return

        // 既存の子要素をクリア
        while (cardContainerRef.current.firstChild) {
          cardContainerRef.current.removeChild(cardContainerRef.current.firstChild)
        }

        // カードフォームを作成
        const card = await paymentsInstance.card({
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
        })

        if (!isMounted || !cardContainerRef.current) return

        // カードフォームをDOMにアタッチ
        await card.attach(cardContainerRef.current)
        cardInstanceRef.current = card
        setIsCardReady(true)
        setIsLoading(false)
      } catch (err) {
        console.error("Square初期化エラー:", err)
        setError(`カード初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
        setIsLoading(false)
      }
    }

    initializeSquare()

    // クリーンアップ関数
    return () => {
      if (cardInstanceRef.current && typeof cardInstanceRef.current.destroy === "function") {
        try {
          cardInstanceRef.current.destroy()
          cardInstanceRef.current = null
        } catch (e) {
          console.error("カードインスタンスの破棄に失敗:", e)
        }
      }
    }
  }, [isMounted, isDev])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCardReady || !cardInstanceRef.current) {
      setError("カード情報が初期化されていません")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // カード情報をトークン化
      const result = await cardInstanceRef.current.tokenize()

      if (result.status === "OK") {
        // トークンを保存して次のステップへ
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
            <div ref={cardContainerRef} id="card-container" className="min-h-[120px]"></div>
          )}
        </div>

        {isDev && <p className="mt-2 text-sm text-gray-500">開発環境では自動的にテストカード情報が使用されます。</p>}

        {!isDev && (
          <p className="mt-2 text-sm text-gray-500"> </p>
        )}
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

// グローバル型定義
declare global {
  interface Window {
    Square: {
      payments(appId: string): Promise<any>
    }
  }
}
