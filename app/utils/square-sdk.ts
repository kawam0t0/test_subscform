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
    // Square Web Payments SDKをスクリプトタグとして読み込む
    const script = document.createElement("script")
    script.src = "https://web.squarecdn.com/v1/square.js"
    document.head.appendChild(script)

    // スクリプトの読み込み完了を待つ
    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
    })

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    if (!appId) throw new Error("Square application ID is not configured")

    // Square SDKの初期化
    return await window.Square.payments(appId, {
      environment: "production",
    })
  } catch (error) {
    console.error("Failed to load Square SDK:", error)
    throw error
  }
}

