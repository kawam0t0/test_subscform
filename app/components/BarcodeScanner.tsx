"use client"

import { useEffect, useRef, useState } from "react"
import { X, Camera, Keyboard } from "lucide-react"

// html5-qrcode の型定義を追加
declare global {
  interface Window {
    Html5QrcodeScanner: any
  }
}

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [html5QrCode, setHtml5QrCode] = useState<any>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualInput, setManualInput] = useState("")

  useEffect(() => {
    // モーダルが閉じられたら、スキャナーをクリアして状態をリセット
    if (!isOpen) {
      if (html5QrCode) {
        try {
          html5QrCode.clear()
        } catch (err) {
          console.error("スキャナーのクリーンアップエラー:", err)
        }
      }
      setHtml5QrCode(null)
      setIsScanning(false)
      setError(null)
      setShowManualInput(false)
      setManualInput("")
      return
    }

    // モーダルが開いていて、スキャナーがまだ初期化されていない場合、すぐにレンダリングを試みる
    const initScanner = async () => {
      if (html5QrCode || showManualInput) return // すでに初期化されているか、手動入力モードの場合は何もしない

      try {
        setError(null) // エラーをリセット
        console.log("BarcodeScanner: html5-qrcodeライブラリの動的インポートを試行中...")

        // ライブラリを動的にインポート
        const { Html5QrcodeScanner } = await import("html5-qrcode")
        console.log("BarcodeScanner: html5-qrcodeライブラリが正常に読み込まれました。")

        if (!Html5QrcodeScanner) {
          throw new Error("Html5QrcodeScannerコンポーネントがモジュール内に見つかりません。")
        }

        if (scannerRef.current) {
          console.log("BarcodeScanner: Html5QrcodeScannerを初期化中...")
          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10, // フレームレート
              qrbox: { width: 250, height: 250 }, // スキャン範囲のボックスサイズ
              aspectRatio: 1.0, // アスペクト比
            },
            false, // 詳細ログを無効にする
          )
          console.log("BarcodeScanner: スキャナーのレンダリングを試行中...")

          // スキャナーをレンダリングし、カメラを起動
          await scanner.render(
            (decodedText: string) => {
              // スキャン成功時のコールバック
              console.log("スキャン成功:", decodedText)
              onScan(decodedText)
              scanner.clear()
              onClose()
            },
            (error: any) => {
              // 継続的なスキャンエラー（例: コードが検出されない）のコールバック
              // このエラーは頻繁に発生するため、UIには表示しないがログには残す
              console.warn("スキャン中のエラー (コード未検出):", error)
            },
          )
          console.log("BarcodeScanner: スキャナーが正常にレンダリングされました。")

          setHtml5QrCode(scanner)
          setIsScanning(true)
        } else {
          setError("スキャンコンテナ（DOM要素）が見つかりません。")
        }
      } catch (err: any) {
        // ライブラリのインポート、初期化、またはカメラ起動時のエラーをキャッチ
        console.error("BarcodeScanner: バーコードスキャナーの初期化に失敗:", err)
        if (err.toString().includes("NotAllowedError") || err.toString().includes("camera")) {
          setError("カメラへのアクセスが拒否されました。ブラウザの設定でカメラの使用を許可してください。")
        } else if (err.message && err.message.includes("Html5QrcodeScanner is not exported")) {
          setError("バーコードスキャナーのコンポーネントが見つかりません。ライブラリのバージョンを確認してください。")
        } else {
          setError(`バーコードスキャナーの初期化に失敗しました: ${err.message || "不明なエラー"}`)
        }
      }
    }

    initScanner()

    // クリーンアップ関数
    return () => {
      if (html5QrCode && isOpen) {
        try {
          html5QrCode.clear()
        } catch (err) {
          console.error("スキャナーのクリーンアップエラー:", err)
        }
      }
    }
  }, [isOpen, html5QrCode, onScan, onClose, showManualInput])

  const handleClose = () => {
    if (html5QrCode) {
      try {
        html5QrCode.clear()
      } catch (err) {
        console.error("スキャナーの停止エラー:", err)
      }
    }
    setHtml5QrCode(null)
    setIsScanning(false)
    setError(null)
    onClose()
  }

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">バーコードスキャン</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* スキャナー部分 */}
        <div className="p-4">
          {showManualInput ? (
            <div className="text-center py-4">
              <div className="mb-4">
                <Keyboard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">手動で会員番号を入力してください</p>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="会員番号を入力"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  確定
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">会員番号のバーコードをカメラに向けてください</p>
                <p className="text-xs text-gray-500 mt-1">
                  （明るい場所で、バーコード全体が画面に収まるように調整してください）
                </p>
              </div>

              {/* スキャナーコンテナ */}
              <div id="qr-reader" ref={scannerRef} className="w-full" style={{ minHeight: "300px" }} />

              <div className="mt-4 text-center flex gap-2 justify-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
