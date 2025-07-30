"use client"

import { useState } from "react"
import { Printer, Download, Settings } from "lucide-react"

interface LabelData {
  customerName: string
  carModel: string
  carColor: string
  referenceId: string
}

interface LabelPrinterProps {
  labelData: LabelData
  onPrintSuccess?: () => void
  onPrintError?: (error: string) => void
}

export function LabelPrinter({ labelData, onPrintSuccess, onPrintError }: LabelPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printerStatus, setPrinterStatus] = useState<string>("")
  const [showSettings, setShowSettings] = useState(false)

  // CUPS経由での印刷
  const printWithCUPS = async () => {
    try {
      setIsPrinting(true)
      setPrinterStatus("ラベルを印刷中...")

      const response = await fetch("/api/print-label-cups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labelData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setPrinterStatus("印刷完了")
        onPrintSuccess?.()
      } else {
        throw new Error(result.error || "印刷に失敗しました")
      }
    } catch (error) {
      console.error("印刷エラー:", error)
      setPrinterStatus("印刷に失敗しました")
      onPrintError?.(error instanceof Error ? error.message : "印刷エラー")
    } finally {
      setIsPrinting(false)
    }
  }

  // PDF生成＆印刷
  const printPDF = async () => {
    try {
      setIsPrinting(true)
      setPrinterStatus("PDFを生成して印刷中...")

      const response = await fetch("/api/print-label-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labelData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setPrinterStatus("印刷完了")
        onPrintSuccess?.()
      } else {
        throw new Error(result.error || "印刷に失敗しました")
      }
    } catch (error) {
      console.error("印刷エラー:", error)
      setPrinterStatus("印刷に失敗しました")
      onPrintError?.(error instanceof Error ? error.message : "印刷エラー")
    } finally {
      setIsPrinting(false)
    }
  }

  // PDFダウンロード
  const downloadPDF = async () => {
    try {
      const response = await fetch("/api/generate-label-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labelData),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `label_${labelData.referenceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("PDFダウンロードエラー:", error)
      onPrintError?.(error instanceof Error ? error.message : "PDFダウンロードエラー")
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Printer className="w-5 h-5" />
        ラベル印刷（MacOS対応）
      </h3>

      {/* ラベルプレビュー */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 bg-gray-50">
        <div className="text-center space-y-2">
          <div className="text-lg font-bold">{labelData.customerName}</div>
          <div className="text-sm text-gray-600">
            {labelData.carModel} / {labelData.carColor}
          </div>
          <div className="text-xs text-gray-500">ID: {labelData.referenceId}</div>
          {/* Code128バーコードプレビュー */}
          <div className="mt-2 flex justify-center">
            <div className="bg-white p-2 border rounded">
              <div className="flex">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className={`w-1 ${i % 2 === 0 ? "h-8 bg-black" : "h-6 bg-black"} mr-px`} />
                ))}
              </div>
              <div className="text-xs mt-1 font-mono">{labelData.referenceId}</div>
            </div>
          </div>
        </div>
      </div>

      {printerStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">{printerStatus}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={printPDF}
            disabled={isPrinting}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? "印刷中..." : "PDF印刷"}
          </button>

          <button
            onClick={printWithCUPS}
            disabled={isPrinting}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            CUPS印刷
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={downloadPDF}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDFダウンロード
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            設定
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">プリンター設定</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• プリンター名: Brother_P950NW</p>
            <p>• 用紙サイズ: 24mm x 60mm</p>
            <p>• バーコード形式: Code128</p>
            <p>• 印刷方式: CUPS (macOS標準)</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">※ Brother P950NWがCUPSに登録されていることを確認してください</p>
    </div>
  )
}
