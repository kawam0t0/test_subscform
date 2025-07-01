declare global {
  interface Window {
    Square: {
      payments(appId: string): Promise<any>
    }
  }
}

// モックカード処理の実装
function createMockPayments() {
  return {
    card: (options: any) => {
      console.log("モックカードオプション:", options)
      return {
        attach: async (element: HTMLElement) => {
          console.log("Mock card attached to element:", element)
          return true
        },
        tokenize: async () => {
          console.log("Mock card tokenized")
          return {
            status: "OK",
            token: "mock_card_token_" + Date.now(),
          }
        },
      }
    },
  }
}

export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

  // 開発環境でモックモードを使用するかどうか
  const useMockInDev = true // 必要に応じてtrueまたはfalseに設定
  const isDev =
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname.includes("stackblitz")

  if (isDev && useMockInDev) {
    console.log("Using mock Square payments in development environment")
    return createMockPayments()
  }

  try {
    console.log("Starting Square initialization in loadSquareSdk function")

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID

    console.log("Environment variables:", {
      appId,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    })

    if (!appId) {
      throw new Error("Required environment variable NEXT_PUBLIC_SQUARE_APP_ID is missing")
    }

    // Square.jsスクリプトが既に読み込まれているか確認
    if (!window.Square) {
      console.log("Loading Square.js script...")
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://web.squarecdn.com/v1/square.js"
        script.async = true
        script.onload = () => {
          console.log("Square.js script loaded successfully")
          resolve()
        }
        script.onerror = (error) => {
          console.error("Failed to load Square.js script:", error)
          reject(error)
        }
        document.head.appendChild(script)
      })

      // スクリプト読み込み後の待機時間
      console.log("Waiting for Square.js to initialize...")
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log("Initializing Square payments with:", { appId })

    try {
      const payments = await window.Square.payments(appId)
      console.log("Square payments initialized successfully")
      return payments
    } catch (error) {
      console.error("Failed to initialize Square payments:", error)
      throw error
    }
  } catch (error) {
    console.error("Square SDK initialization error:", error)

    // エラーが発生した場合でもモックを返す（開発環境のみ）
    if (isDev) {
      console.log("Falling back to mock implementation due to error")
      return createMockPayments()
    }

    throw error
  }
}
