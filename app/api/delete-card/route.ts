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
    const { result } = await squareClient.cardsApi.listCards()

    // 指定された顧客IDに紐づくカードをフィルタリング
    const customerCards = result.cards?.filter((card) => card.customerId === customerId) || []

    if (customerCards.length === 0) {
      return NextResponse.json({
        success: true,
        message: "削除対象のカードが存在しません",
      })
    }

    // 既存のカードをすべて削除
    for (const card of customerCards) {
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

