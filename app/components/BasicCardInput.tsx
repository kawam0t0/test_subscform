"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import type { BaseFormProps } from "../types"
import { loadSquareSdk } from "../utils/square-sdk"

export function BasicCardInput({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const cardInstanceRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    const initializeSquare = async () => {
      try {
        setError(null)
        console.log("Square初期化を開始します")

        if (!cardContainerRef.current) {
          throw new Error("カードコンテナが見つかりません")
        }

        const payments = await loadSquareSdk()
        if (!payments || !isMounted) return

        console.log("Square SDKが正常に読み込まれました。カードを初期化します")

        // カードフォームを作成
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

    initializeSquare()

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
