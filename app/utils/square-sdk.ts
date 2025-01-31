// グローバルウィンドウの型定義を拡張
declare global {
  interface Window {
    Square: {
      payments(
        appId: string,
        options: {
          environment: "sandbox" | "production"
          locationId: string
        },
      ): Promise<{
        card(): Promise<{
          attach(element: HTMLElement): Promise<void>
          tokenize(): Promise<{
            status: string
            token?: string
            errors?: Array<{
              code: string
              message: string
            }>
          }>
        }>
      }>
    }
  }
}

const DEBUG = true // デバッグモードを有効化

export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

  try {
    if (DEBUG) {
      console.group("Square SDK 初期化デバッグ")
      console.log("環境変数:", {
        NEXT_PUBLIC_SQUARE_APP_ID: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
        NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        environment: "production",
      })
    }

    const script = document.createElement("script")
    script.src = "https://web.squarecdn.com/v1/square.js"

    // スクリプトのロードエラーをキャッチ
    script.onerror = (error) => {
      if (DEBUG) {
        console.error("Square SDKスクリプトロードエラー:", error)
      }
    }

    document.head.appendChild(script)

    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
    })

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

    if (DEBUG) {
      console.log("解析された値:", {
        appId,
        locationId,
        appIdLength: appId?.length,
        locationIdLength: locationId?.length,
      })
    }

    if (!appId) {
      throw new Error("Square アプリケーションIDが設定されていません")
    }

    if (!locationId) {
      throw new Error("Square ロケーションIDが設定されていません")
    }

    if (DEBUG) {
      console.log("Square SDKを初期化中:", {
        appId: `${appId.substring(0, 4)}...${appId.substring(appId.length - 4)}`,
        locationId: `${locationId.substring(0, 4)}...${locationId.substring(locationId.length - 4)}`,
        environment: "production",
      })
    }

    const payments = await window.Square.payments(appId, {
      environment: "production",
      locationId: locationId.trim(), // 余分な空白を除去
    })

    if (DEBUG) {
      console.log("Square SDKが正常に初期化されました")
      console.groupEnd()
    }

    return payments
  } catch (error) {
    if (DEBUG) {
      console.group("Square SDKエラー詳細")
      console.error("完全なエラーオブジェクト:", error)

      if (error instanceof Error) {
        console.error("エラー名:", error.name)
        console.error("エラーメッセージ:", error.message)
        console.error("エラースタック:", error.stack)

        // エラーオブジェクトの全プロパティを表示
        console.log(
          "エラープロパティ:",
          Object.getOwnPropertyNames(error).reduce((acc, prop) => {
            acc[prop] = (error as any)[prop]
            return acc
          }, {} as any),
        )
      }

      console.log("現在の環境変数の状態:", {
        hasAppId: !!process.env.NEXT_PUBLIC_SQUARE_APP_ID,
        hasLocationId: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        appIdLength: process.env.NEXT_PUBLIC_SQUARE_APP_ID?.length,
        locationIdLength: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID?.length,
      })

      console.groupEnd()
    }
    throw error
  }
}

