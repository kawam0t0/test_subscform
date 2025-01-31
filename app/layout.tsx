import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cool Blue Square POS Form",
  description: "Stylish customer information form integrated with Square POS",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-4">{children}</body>
    </html>
  )
}



