"use client"

import { useEffect } from "react"
import { CustomerForm } from "./components/CustomerForm"

export default function Home() {
  useEffect(() => {
    const newDomain = "https://square-form-secure.vercel.app" // ここを実際の新しいドメインに変更してください

    // 現在のURLが古いドメインの場合のみリダイレクト
    if (window.location.hostname === "square-form-app.vercel.app") {
      // 現在のパスとクエリパラメータを保持してリダイレクト
      const currentPath = window.location.pathname + window.location.search
      window.location.replace(newDomain + currentPath)
    }
  }, [])

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-white">
      <CustomerForm />
    </main>
  )
}
