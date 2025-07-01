import { NextResponse } from "next/server"
import { getSquareClient } from "../../utils/square-client"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locationId = url.searchParams.get("locationId")
    const customerId = url.searchParams.get("customerId")

    if (!locationId) {
      return NextResponse.json({ success: false, error: "locationIdが必要です" }, { status: 400 })
    }

    const squareClient = getSquareClient()

    // サブスクリプションを取得
    const { result } = await squareClient.subscriptionsApi.searchSubscriptions({
      query: {
        filter: {
          locationIds: [locationId],
          customerIds: customerId ? [customerId] : undefined,
        },
      },
    })

    return NextResponse.json({
      success: true,
      subscriptions: result.subscriptions || [],
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
