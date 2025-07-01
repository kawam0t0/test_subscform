import { NextResponse } from "next/server"
import { getSquareClient } from "../../utils/square-client"

export async function POST(request: Request) {
  try {
    const { subscriptionId, action } = await request.json()

    const squareClient = getSquareClient()

    let result
    let message

    switch (action) {
      case "cancel":
        // サブスクリプションをキャンセル
        result = await squareClient.subscriptionsApi.cancelSubscription(subscriptionId)
        message = "サブスクリプションが正常にキャンセルされました"
        break

      case "pause":
        // サブスクリプションを一時停止
        result = await squareClient.subscriptionsApi.pauseSubscription(subscriptionId)
        message = "サブスクリプションが正常に一時停止されました"
        break

      case "resume":
        // サブスクリプションを再開
        result = await squareClient.subscriptionsApi.resumeSubscription(subscriptionId)
        message = "サブスクリプションが正常に再開されました"
        break

      default:
        throw new Error("無効なアクションです")
    }

    return NextResponse.json({
      success: true,
      message: message,
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
