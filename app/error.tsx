"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-red-600">エラーが発生しました</h2>
        <p className="mb-4 text-gray-600">申し訳ありませんが、予期せぬエラーが発生しました。</p>
        <button onClick={reset} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          もう一度試す
        </button>
      </div>
    </div>
  )
}
