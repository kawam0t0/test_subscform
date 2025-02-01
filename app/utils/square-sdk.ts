const DEBUG = true // デバッグモードを有効化

export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

  try {
    if (DEBUG) {
      console.group("Square SDK 初期化デバッグ")
      const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

      console.log("環境変数の値:", {
        appId: appId ? `${appId.substring(0, 4)}...${appId.substring(appId.length - 4)}` : "未設定",
        locationId: locationId
          ? `${locationId.substring(0, 4)}...${locationId.substring(locationId.length - 4)}`
          : "未設定",
        environment: "production",
      })
    }

    // Square.jsの読み込みを待機
    if (!document.querySelector('script[src="https://web.squarecdn.com/v1/square.js"]')) {
      const script = document.createElement("script")
      script.src = "https://web.squarecdn.com/v1/square.js"

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = (error) => {
          console.error("Square SDKスクリプトロードエラー:", error)
          reject(error)
        }
        document.head.appendChild(script)
      })
    }

    // 環境変数の取得と検証
    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID?.trim()

    if (!appId || !locationId) {
      throw new Error(
        `必要な環境変数が設定されていません: ${!appId ? "NEXT_PUBLIC_SQUARE_APP_ID" : ""} ${!locationId ? "NEXT_PUBLIC_SQUARE_LOCATION_ID" : ""}`,
      )
    }

    // Square SDKが利用可能になるまで待機
    await new Promise<void>((resolve) => {
      const checkSquare = () => {
        if (window.Square) {
          resolve()
        } else {
          setTimeout(checkSquare, 100)
        }
      }
      checkSquare()
    })

    try {
      const payments = await window.Square.payments(appId, {
        environment: "production",
        locationId: locationId,
      })

      if (DEBUG) {
        console.log("Square SDKが正常に初期化されました")
        console.groupEnd()
      }

      return payments
    } catch (error) {
      console.error("Square Payments初期化エラー:", error)
      throw error
    }
  } catch (error) {
    if (DEBUG) {
      console.group("Square SDKエラー詳細")
      console.error("エラー詳細:", error)
      console.groupEnd()
    }
    throw error
  }
}

// グローバル型定義
declare global {
  interface Window {
    Square: {
      payments(
        appId: string,
        options: {
          environment: "sandbox" | "production"
          locationId: string
        },
      ): Promise<any>
    }
  }
}

