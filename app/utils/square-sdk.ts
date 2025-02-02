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

export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

  try {
    console.log("Starting Square initialization in loadSquareSdk function")

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

    console.log("Environment variables:", {
      appId,
      locationId,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    })

    if (!appId || !locationId) {
      throw new Error(`Required environment variables are missing. 
        NEXT_PUBLIC_SQUARE_APP_ID: ${appId ? "set" : "missing"},
        NEXT_PUBLIC_SQUARE_LOCATION_ID: ${locationId ? "set" : "missing"}`)
    }

    // Square.jsの読み込み
    if (!window.Square) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://web.squarecdn.com/v1/square.js"
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

      // スクリプトが完全に読み込まれるのを待つ
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log("Initializing Square payments with:", {
      appId,
      locationId,
      environment: "production",
    })

    try {
      const payments = await window.Square.payments(appId, {
        environment: "production",
        locationId: locationId,
      })

      console.log("Square payments initialized successfully")
      return payments
    } catch (error) {
      console.error("Failed to initialize Square payments:", error)
      throw error
    }
  } catch (error) {
    console.error("Square SDK initialization error:", error)
    throw error
  }
}

