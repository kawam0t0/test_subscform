declare global {
  interface Window {
    Square: {
      payments(appId: string): Promise<any>
    }
  }
}

export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

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

    let attempts = 0
    const maxAttempts = 50 // 5秒間待機

    while (!window.Square && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (!window.Square) {
      throw new Error("Square SDK failed to load")
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
    throw error
  }
}
