import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { v4 as uuidv4 } from "uuid"

// Square APIクライアント初期化
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

export async function POST(request: Request) {
  try {
    const { customerId, locationId, planId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ success: false, error: "顧客IDが必要です" }, { status: 400 })
    }

    if (!locationId) {
      return NextResponse.json({ success: false, error: "店舗IDが必要です" }, { status: 400 })
    }

    if (!planId) {
      return NextResponse.json({ success: false, error: "プランIDが必要です" }, { status: 400 })
    }

    console.log(`サブスクリプション作成: プランID=${planId}, 顧客ID=${customerId}, 店舗ID=${locationId}`)

    try {
      // カード情報の取得方法を変更 - 別のAPIエンドポイントを使用
      // searchCardsを使用してみる
      const { result: cardsResult } = await squareClient.cardsApi.searchCards({
        query: {
          filter: {
            customerIds: [customerId],
          },
        },
      })

      if (!cardsResult.cards || cardsResult.cards.length === 0) {
        return NextResponse.json({ success: false, error: "顧客のカード情報が見つかりません" }, { status: 404 })
      }

      // 最新のカードを使用
      const cardId = cardsResult.cards[0].id

      // サブスクリプションを作成
      const { result: subscriptionResult } = await squareClient.subscriptionsApi.createSubscription({
        idempotencyKey: uuidv4(),
        locationId: locationId,
        planId: planId,
        customerId: customerId,
        cardId: cardId,
        startDate: new Date().toISOString().split("T")[0], // 開始日（今日）
        timezone: "Asia/Tokyo", // タイムゾーン
      })

      if (!subscriptionResult.subscription) {
        throw new Error("サブスクリプションの作成に失敗しました")
      }

      console.log(`サブスクリプション作成成功: ID=${subscriptionResult.subscription.id}`)
      return NextResponse.json({
        success: true,
        subscriptionId: subscriptionResult.subscription.id,
        message: "サブスクリプションが正常に作成されました",
      })
    } catch (error) {
      console.error("サブスクリプション作成エラー:", error)
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "サブスクリプションの作成に失敗しました" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
