"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import type { BaseFormProps } from "../types"

export function BasicCardInput({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const cardInstanceRef = useRef<any>(null)

  // Square SDKの読み込みと初期化
  useEffect(() => {
    let scriptLoaded = false
    let isMounted = true

    const loadSquareScript = async () => {
      try {
        setError(null)

        // Square.jsがまだ読み込まれていない場合は読み込む
        if (!window.Square && !scriptLoaded) {
          console.log("Square.jsスクリプトを読み込み中...")
          scriptLoaded = true

          const script = document.createElement("script")
          script.src = "https://web.squarecdn.com/v1/square.js"
          script.async = true

          script.onload = () => {
            console.log("Square.jsスクリプトの読み込みが完了しました")
            if (isMounted) {
              initializeSquare()
            }
          }

          script.onerror = (e) => {
            console.error("Square.jsスクリプトの読み込みに失敗しました", e)
            if (isMounted) {
              setError("Square SDKの読み込みに失敗しました")
              setIsLoading(false)
            }
          }

          document.head.appendChild(script)
        } else if (window.Square) {
          // すでに読み込まれている場合は初期化
          console.log("Square.jsはすでに読み込まれています")
          initializeSquare()
        }
      } catch (err) {
        console.error("Square SDK読み込みエラー:", err)
        if (isMounted) {
          setError(`初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`)
          setIsLoading(false)
        }
      }
    }

    const initializeSquare = async () => {
      try {
        if (!window.Square) {
          console.error("Square SDKが利用できません")
          if (isMounted) {
            setError("Square SDKが利用できません")
            setIsLoading(false)
          }
          return
        }

        console.log("Square Paymentsを初期化中...")
        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID

        if (!appId) {
          console.error("Square App IDが設定されていません")
          if (isMounted) {
            setError("Square App IDが設定されていません")
            setIsLoading(false)
          }
          return
        }

        // Squareの支払い機能を初期化
        const payments = await window.Square.payments(appId)
        console.log("Square Paymentsの初期化が完了しました")

        if (!isMounted) return

        if (!cardContainerRef.current) {
          console.error("カードコンテナが見つかりません")
          if (isMounted) {
            setError("カードコンテナが見つかりません")
            setIsLoading(false)
          }
          return
        }

        // カードフォームを作成
        console.log("カードフォームを作成中...")
        const card = await payments.card()
        console.log("カードフォームの作成が完了しました")

        if (!isMounted) return

        // カードフォームをDOMにアタッチ
        console.log("カードフォームをDOMにアタッチ中...")
        await card.attach(cardContainerRef.current)
        console.log("カードフォームのアタッチが完了しました")

        if (isMounted) {
          cardInstanceRef.current = card
          setIsLoading(false)
        }
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
      isMounted = false
      if (cardInstanceRef.current && typeof cardInstanceRef.current.destroy === "function") {
        try {
          cardInstanceRef.current.destroy()
        } catch (e) {
          console.error("カードインスタンスの破棄に失敗:", e)
        }
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardInstanceRef.current) {
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
        console.log("カード情報のトークン化に成功しました:", result.token)
        // トークンを保存して次のステップへ
        updateFormData({ cardToken: result.token })
        nextStep()
      } else {
        console.error("カード情報のトークン化に失敗しました:", result.errors)
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
          {/* カードコンテナは常に存在するようにし、表示/非表示を切り替える */}
          <div className="min-h-[120px]">
            {isLoading && (
              <div className="flex items-center justify-center h-[120px]">
                <div className="text-center">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full"></div>
                  <p className="mt-2 text-sm text-gray-500">カード入力フォームを読み込み中...</p>
                </div>
              </div>
            )}
            <div
              ref={cardContainerRef}
              id="card-container"
              className="min-h-[120px]"
              style={{ display: isLoading ? "none" : "block" }}
            ></div>
          </div>
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
        <button type="submit" disabled={isLoading || !cardInstanceRef.current} className="btn btn-primary">
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
