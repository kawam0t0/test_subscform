declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SQUARE_APP_ID: string
      NEXT_PUBLIC_SQUARE_LOCATION_ID: string
    }
  }
}

const DEBUG = true

export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

  try {
    // 環境変数の取得
    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

    // 環境変数の確認ログ
    console.log("環境変数の確認:", { appId, locationId })
    console.log("✅ 環境変数の確認:", {
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
    });
    // `locationId` のデバッグ出力（改行・特殊文字がないか確認）
    if (locationId) {
      console.log("locationId詳細:", {
        raw: locationId,
        json: locationId, // JSON.stringify() を使わず、そのまま表示
        base64: btoa(locationId)
      });
    }

    // 環境変数の存在確認と型チェック
    if (!appId || typeof appId !== "string" || !locationId || typeof locationId !== "string") {
      throw new Error(
        `Required environment variables are missing or not strings: ${!appId || typeof appId !== "string" ? "NEXT_PUBLIC_SQUARE_APP_ID" : ""} ${!locationId || typeof locationId !== "string" ? "NEXT_PUBLIC_SQUARE_LOCATION_ID" : ""}`,
      )
    }

    // 環境変数の値をトリムし、明示的に文字列として扱う
    const trimmedAppId = String(appId).trim()
    const trimmedLocationId = String(locationId).trim()

    // ストレージのクリア
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.warn("ストレージのクリアに失敗しました:", e)
    }

    console.log("Square SDK initialization starting...")

    // Square.jsの読み込みを確実に
    if (!window.Square) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://web.squarecdn.com/v1/square.js"
        script.onload = () => {
          console.log("Square.jsスクリプトが正常に読み込まれました")
          resolve()
        }
        script.onerror = (error) => {
          console.error("Square.jsスクリプトの読み込みに失敗しました:", error)
          reject(error)
        }
        document.head.appendChild(script)
      })

      // スクリプトが読み込まれた後、少し待機
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log("Square SDKを初期化します:", {
      appId: trimmedAppId,
      locationId: trimmedLocationId,
    })

    // Square SDKの初期化を試みる
    try {
      const payments = await window.Square.payments(trimmedAppId, {
        environment: "production",
        locationId: trimmedLocationId,
      })

      console.log("Square SDKが正常に初期化されました")
      return payments
    } catch (error) {
      console.error("Square paymentsの初期化に失敗しました:", error)
      throw error
    }
  } catch (error) {
    console.error("Square SDK初期化エラー:", error)
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