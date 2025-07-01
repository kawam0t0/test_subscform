"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import type { BaseFormProps } from "../types"

export function PaymentInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isCardReady, setIsCardReady] = useState(false)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const cardInstanceRef = useRef<any>(null)
  const paymentsInstanceRef = useRef<any>(null)

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

  // Square SDKの読み込みと初期化
  useEffect(() => {
    if (!isMounted) return

    let scriptLoaded = false

    const loadSquareScript = async () => {
      try {
        setError(null)
        setIsLoading(true)

        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID

        if (!appId) {
          throw new Error("Square App IDが設定されていません")
        }

        console.log("Square App ID:", appId)

        // Square.jsがまだ読み込まれていない場合は読み込む
        if (!window.Square && !scriptLoaded) {
          scriptLoaded = true
          console.log("Square.jsスクリプトを読み込み中...")

          const script = document.createElement("script")
          script.src = "https://web.squarecdn.com/v1/square.js"
          script.async = true
          script.onload = () => {
            console.log("Square.jsスクリプトの読み込み完了")
            if (isMounted) {
              initializeSquare(appId)
            }
          }
          script.onerror = () => {
            console.error("Square.jsスクリプトの読み込み失敗")
            if (isMounted) {
              setError("Square SDKの読み込みに失敗しました")
              setIsLoading(false)
            }
          }
          document.head.appendChild(script)
        } else if (window.Square) {
          // すでに読み込まれている場合は初期化
          console.log("Square.jsは既に読み込まれています")
          initializeSquare(appId)
        }
      } catch (err) {
        console.error("Square SDK読み込みエラー:", err)
        if (isMounted) {
          setError(`初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
          setIsLoading(false)
        }
      }
    }

    const initializeSquare = async (appId: string) => {
      try {
        if (!window.Square || !isMounted) return

        console.log("Square Paymentsを初期化中...")

        // Squareの支払い機能を初期化
        const payments = await window.Square.payments(appId)
        paymentsInstanceRef.current = payments

        console.log("Square Payments初期化完了")

        if (!isMounted || !cardContainerRef.current) return

        // 既存の子要素をクリア
        while (cardContainerRef.current.firstChild) {
          cardContainerRef.current.removeChild(cardContainerRef.current.firstChild)
        }

        console.log("カードフォームを作成中...")

        // シンプルなスタイル設定（エラーを避けるため）
        const card = await payments.card({
          style: {
            input: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
            },
            "input::placeholder": {
              color: "#999999",
            },
            ".input-container": {
              borderColor: "#E5E7EB",
              borderRadius: "8px",
            },
            ".input-container.is-focus": {
              borderColor: "#3B82F6",
            },
            ".input-container.is-error": {
              borderColor: "#EF4444",
            },
          },
        })

        console.log("カードフォーム作成完了")

        if (!isMounted || !cardContainerRef.current) return

        // カードフォームをDOMにアタッチ
        console.log("カードフォームをアタッチ中...")
        await card.attach(cardContainerRef.current)

        console.log("カードフォームアタッチ完了")

        cardInstanceRef.current = card
        setIsCardReady(true)
        setIsLoading(false)
      } catch (err) {
        console.error("Square初期化エラー:", err)
        if (isMounted) {
          setError(`カード初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
          setIsLoading(false)
        }
      }
    }

    loadSquareScript()

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
  }, [isMounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCardReady || !cardInstanceRef.current) {
      setError("カード情報が初期化されていません")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log("カード情報をトークン化中...")

      // カード情報をトークン化
      const result = await cardInstanceRef.current.tokenize()

      console.log("トークン化結果:", result)

      if (result.status === "OK") {
        console.log("カード情報のトークン化成功:", result.token)

        // 実際のトークンを保存して次のステップへ
        updateFormData({ cardToken: result.token })
        nextStep()
      } else {
        console.error("カード情報のトークン化失敗:", result.errors)
        const errorMessage = result.errors?.[0]?.message || "カードの処理中にエラーが発生しました"
        throw new Error(errorMessage)
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

        <p className="mt-2 text-sm text-gray-500">
          テスト用カード番号: 4111 1111 1111 1111（有効期限は未来の日付、CVVは任意の3桁）
        </p>
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
    Square?: {
      payments(appId: string): Promise<any>
    }
  }
}
