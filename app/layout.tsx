import type React from "react"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "安全なページへリダイレクト",
  description: "このページは安全なドメインにリダイレクトします",
  robots: "index, follow",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="googlebot" content="index, follow" />
        <meta httpEquiv="refresh" content="2;url=https://carwashform.app" />
      </head>
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  )
}



