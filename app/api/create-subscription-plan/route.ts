import { NextResponse } from "next/server"
import { getSquareClient } from "../../utils/square-client"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const { planName, planDescription, price, locationId } = await request.json()

    const squareClient = getSquareClient()

    // 1. カタログアイテム（サブスクリプションプラン）を作成
    const { result: catalogResult } = await squareClient.catalogApi.upsertCatalogObject({
      idempotencyKey: uuidv4(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: `#${planName.replace(/\s+/g, "_").toLowerCase()}`,
        subscriptionPlanData: {
          name: planName,
          phases: [
            {
              cadence: "MONTHLY", // 月額プラン
              recurringPriceMoney: {
                amount: BigInt(price),
                currency: "JPY",
              },
              ordinal: 0,
            },
          ],
        },
      },
    })

    if (!catalogResult.catalogObject) {
      throw new Error("サブスクリプションプランの作成に失敗しました")
    }

    const planId = catalogResult.catalogObject.id

    return NextResponse.json({
      success: true,
      planId: planId,
      message: "サブスクリプションプランが正常に作成されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
