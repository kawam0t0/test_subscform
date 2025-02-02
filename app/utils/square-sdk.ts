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
    console.log("Starting Square initialization in loadSquareSdk function")

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

    console.log("Raw environment variables:", { appId, locationId })

    if (!appId || typeof appId !== "string" || !locationId || typeof locationId !== "string") {
      throw new Error("Required environment variables are missing or not strings")
    }

    const trimmedAppId = appId.trim()
    const trimmedLocationId = locationId.trim()

    console.log("Trimmed values:", { trimmedAppId, trimmedLocationId })

    if (trimmedLocationId.length !== 12) {
      throw new Error(`Invalid locationId length: ${trimmedLocationId.length}. Expected 12 characters.`)
    }

    try {
      localStorage.clear()
      sessionStorage.clear()
      console.log("Storage cleared successfully")
    } catch (e) {
      console.warn("Failed to clear storage:", e)
    }

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

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log("Initializing Square SDK with:", { appId: trimmedAppId, locationId: trimmedLocationId })

    const payments = await window.Square.payments(trimmedAppId, {
      environment: "production",
      locationId: trimmedLocationId,
    })

    console.log("Square SDK initialized successfully")
    return payments
  } catch (error) {
    console.error("Square SDK initialization error:", error)
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

