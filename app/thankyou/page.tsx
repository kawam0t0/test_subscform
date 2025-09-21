"use client"

import { useEffect } from "react"

export default function ThankYou() {
  useEffect(() => {
    const newDomain = "https://square-form-secure.vercel.app"

    if (window.location.hostname === "square-form-app.vercel.app") {
      const currentPath = window.location.pathname + window.location.search
      window.location.replace(newDomain + currentPath)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">ありがとうございました</h1>
        <p className="text-gray-600">お手続きが完了いたしました。確認メールをお送りしております。</p>
      </div>
    </div>
  )
}
