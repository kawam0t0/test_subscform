// 型定義を直接記述
type Payments = {
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

type PaymentsOptions = {
  environment: "sandbox" | "production"
}

// グローバル型定義
declare global {
  interface Window {
    Square: {
      payments: (appId: string, options?: PaymentsOptions) => Promise<Payments>
    }
  }
}

export async function loadSquareSdk(): Promise<Payments | null> {
  if (typeof window === "undefined") return null

  try {
    // デバッグ情報の出力
    console.log("Square SDK Initialization Debug Info:", {
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      environment: process.env.NODE_ENV,
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

    // 環境設定のデバッグ出力
    const environment = process.env.NODE_ENV === "production" ? "production" : "sandbox"
    console.log(`Initializing Square SDK in ${environment} environment with App ID: ${appId.substring(0, 8)}...`)

    const payments = await window.Square.payments(appId, { environment })
    console.log("Square SDK initialized successfully")
    return payments
  } catch (error) {
    console.error("Square SDK Initialization Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ? "Set" : "Not set",
      environment: process.env.NODE_ENV,
    })
    throw error
  }
}

