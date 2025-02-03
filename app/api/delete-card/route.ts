import { NextResponse } from "next/server"
import { Client, Environment } from "square"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    // 顧客の既存のカード情報を取得
    const { result } = await squareClient.cardsApi.listCards({
      cursor: undefined,
      limit: undefined,
      customerId: customerId,
    })

    if (!result.cards || result.cards.length === 0) {
      return NextResponse.json({
        success: true,
        message: "削除対象のカードが存在しません",
      })
    }

    // 既存のカードをすべて削除
    for (const card of result.cards) {
      if (card.id) {
        await squareClient.cardsApi.disableCard(card.id)
        console.log(`カードID: ${card.id} を削除しました`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "古いカード情報が正常に削除されました",
    })
  } catch (error) {
    console.error("カード削除エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "カード情報の削除中にエラーが発生しました",
      },
      { status: 500 },
    )
  }
}

