"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { CreditCard, Camera, AlertCircle } from "lucide-react"
import type { BaseFormProps } from "../types"

export function NewPaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCameraSupported, setIsCameraSupported] = useState(false)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const [cardInstance, setCardInstance] = useState<any>(null)

  // 開発環境かどうかを判定
  const isDev = process.env.NODE_ENV === "development"

  useEffect(() => {
    // クリーンアップ用のフラグ
    let isMounted = true

    const initializeCard = async () => {
      try {
        if (!cardContainerRef.current) return

        // 既存の子要素をすべて削除（安全に行う）
        if (cardContainerRef.current.hasChildNodes()) {
          const fragment = document.createDocumentFragment()
          cardContainerRef.current.replaceChildren(fragment)
        }

        // 開発環境ではモックUIを表示
        if (isDev) {
          if (!isMounted) return

          // モックUIを作成
          const mockContainer = document.createElement("div")
          mockContainer.className = "mock-card-container"
          mockContainer.innerHTML = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">カード番号</label>
              <div class="relative">
                <input type="text" value="4111 1111 1111 1111" readonly class="w-full p-2 border border-gray-300 rounded-md bg-gray-50 pr-10">
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
              </div>
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

          // モックUIをDOMに追加
          if (cardContainerRef.current && isMounted) {
            cardContainerRef.current.appendChild(mockContainer)

            // モックカードインスタンスを作成
            setCardInstance({
              tokenize: async () => ({
                status: "OK",
                token: `mock_card_${Date.now()}`,
              }),
            })

            setIsCameraSupported(true) // 開発環境ではカメラサポートありとする
            setIsLoading(false)
          }

          return
        }

        // 本番環境: Square SDKを読み込む
        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID

        if (!appId) {
          throw new Error("Square App IDが設定されていません")
        }

        // Square.jsを動的に読み込む
        if (!window.Square) {
          const script = document.createElement("script")
          script.src = "https://web.squarecdn.com/v1/square.js"
          script.async = true

          const loadScript = new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Square.jsの読み込みに失敗しました"))
            document.head.appendChild(script)
          })

          await loadScript
        }

        // Square SDKが利用可能になるまで待機
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (!isMounted) return

        // Squareの支払い機能を初期化
        const payments = await window.Square.payments(appId)

        // カメラサポートの確認
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          setIsCameraSupported(true)
        }

        // カードフォームを作成（カメラ機能付き）
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

        if (!isMounted) return

        // カードフォームをDOMにアタッチ
        if (cardContainerRef.current) {
          await card.attach(cardContainerRef.current)
          setCardInstance(card)
        }
      } catch (err) {
        console.error("カード初期化エラー:", err)
        if (isMounted) {
          setError(`カード初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // カード初期化を実行
    initializeCard()

    // クリーンアップ関数
    return () => {
      isMounted = false

      // カードインスタンスがあれば��棄
      if (cardInstance && typeof cardInstance.destroy === "function") {
        try {
          cardInstance.destroy()
        } catch (e) {
          console.error("カードインスタンスの破棄に失敗:", e)
        }
      }
    }
  }, [isDev])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardInstance) {
      setError("カード情報が初期化されていません")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // カード情報をトークン化
      const result = await cardInstance.tokenize()

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
          {isCameraSupported && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Camera className="h-4 w-4" />
              <span>カメラ読み取り対応</span>
            </div>
          )}
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
            <div
              ref={cardContainerRef}
              id="card-container"
              className="min-h-[120px]"
              style={{ minHeight: "120px" }}
            ></div>
          )}
        </div>

        {isCameraSupported && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700 font-medium">📱 カメラでカード読み取り</p>
                <p className="text-sm text-blue-600 mt-1">
                  カード番号入力欄のカメラアイコン📷をタップして、クレジットカードをスキャンできます。
                  カード番号と有効期限が自動で入力されます。
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-500">
                  <AlertCircle className="w-3 h-3" />
                  <span>カメラアクセス許可が必要です</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDev && (
          <p className="mt-2 text-sm text-gray-500">
            開発環境では自動的にテストカード情報が使用されます。カメラアイコンはデモ表示です。
          </p>
        )}

        {!isDev && (
          <p className="mt-2 text-sm text-gray-500">
            テスト用カード番号: 4111 1111 1111 1111（有効期限は未来の日付、CVVは任意の3桁）
          </p>
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
        <button type="submit" disabled={isLoading || !cardInstance} className="btn btn-primary">
          {isLoading ? "処理中..." : "次へ"}
        </button>
      </div>
    </form>
  )
}

// グローバル型定義
declare global {
  interface Window {
    Square?: {
      payments(appId: string): Promise<any>
    }
  }
}
