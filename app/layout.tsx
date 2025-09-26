import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import Script from "next/script"

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
      </head>
      <body className="min-h-screen bg-white">
        <Script src="https://web.squarecdn.com/v1/square.js" strategy="beforeInteractive" id="square-sdk" />
        {children}
      </body>
    </html>
  )
}
