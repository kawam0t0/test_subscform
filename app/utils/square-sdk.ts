export async function loadSquareSdk() {
  if (typeof window === "undefined") return null

  const payments = await import("@square/web-payments-sdk-v2")
  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
  if (!appId) throw new Error("Square application ID is not configured")

  return await payments.payments(appId, {
    environment: "production" // sandboxから本番環境に変更
  })
}