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
      payments: (
        appId: string,
        options: {
          environment: "sandbox" | "production"
          locationId?: string
        },
      ) => Promise<SquarePayments>
    }
  }
}

export async function loadSquareSdk(): Promise<SquarePayments | null> {
  if (typeof window === "undefined") return null

  try {
    // デバッグ情報の出力
    console.log("Square SDK Initialization Debug Info:", {
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      environment: "production",
      hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
    })

    const script = document.createElement("script")
    script.src = "https://web.squarecdn.com/v1/square.js"
    document.head.appendChild(script)

    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
    })

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

    if (!appId) {
      throw new Error("Square application ID is not configured")
    }

    if (!locationId) {
      throw new Error("Square location ID is not configured")
    }

    // locationIdを追加
    const payments = await window.Square.payments(appId, {
      environment: "production",
      locationId: locationId,
    })

    console.log("Square SDK initialized successfully in production mode")
    return payments
  } catch (error) {
    console.error("Square SDK Initialization Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ? "Set" : "Not set",
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ? "Set" : "Not set",
      environment: "production",
    })
    throw error
  }
}

