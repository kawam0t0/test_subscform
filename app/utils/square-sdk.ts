declare global {
  interface Window {
    Square: any
  }
}

export const loadSquareSdk = async () => {
  try {
    console.log("Checking Square SDK initialization...")
    console.log("Application ID:", process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID)
    console.log("Location ID:", process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID)

    if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || !process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      throw new Error("Square credentials are not properly configured")
    }

    if (typeof window.Square !== "undefined") {
      console.log("Square SDK already loaded, initializing payments...")
      return window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      )
    }

    console.log("Loading Square SDK...")
    const script = document.createElement("script")
    script.src = "https://sandbox.web.squarecdn.com/v1/square.js"
    script.async = true
    document.body.appendChild(script)

    return new Promise<any>((resolve, reject) => {
      script.onload = async () => {
        console.log("Square SDK loaded, initializing payments...")
        if (typeof window.Square !== "undefined") {
          try {
            const payments = await window.Square.payments(
              process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
              process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
            )
            console.log("Square payments initialized successfully")
            resolve(payments)
          } catch (error) {
            console.error("Failed to initialize Square payments:", error)
            reject(error)
          }
        } else {
          const error = new Error("Failed to load Square SDK")
          console.error(error)
          reject(error)
        }
      }
      script.onerror = (error) => {
        console.error("Error loading Square SDK:", error)
        reject(new Error("Failed to load Square SDK"))
      }
    })
  } catch (error) {
    console.error("Error in loadSquareSdk:", error)
    throw error
  }
}

