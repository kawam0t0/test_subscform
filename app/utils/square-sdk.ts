// Square Web Payments SDKの型定義
type SquarePayments = {
  card: () => Promise<{
    attach: (element: HTMLElement) => Promise<void>
    tokenize: () => Promise<{
      status: string
      token?: string
      errors?: Array<{
        code: string
        message: string
      }>
    }>
  }>
}

// グローバルウィンドウの型定義を拡張
declare global {
  interface Window {
    Square: {
      payments: (appId: string, options: { environment: "sandbox" | "production" }) => Promise<SquarePayments>
    }
  }
}

export async function loadSquareSdk(): Promise<SquarePayments | null> {
  if (typeof window === "undefined") return null

  try {
    // デバッグ情報の出力
    console.log("Square SDK Initialization Debug Info:", {
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      environment: "production", // 明示的に本番環境を指定
      hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasLocationId: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    })

    const script = document.createElement("script")
    script.src = "https://web.squarecdn.com/v1/square.js"
    document.head.appendChild(script)

    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
    })

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    if (!appId) {
      console.error("Square application ID is not configured")
      throw new Error("Square application ID is not configured")
    }

    // 環境を明示的にproductionに設定
    const payments = await window.Square.payments(appId, {
      environment: "production", // 必ず本番環境を指定
    })

    console.log("Square SDK initialized successfully in production mode")
    return payments
  } catch (error) {
    console.error("Square SDK Initialization Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ? "Set" : "Not set",
      environment: "production",
    })
    throw error
  }
}

