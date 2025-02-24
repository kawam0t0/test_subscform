import { NextResponse } from "next/server"
import { Client, Environment } from "square"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

export async function POST(request: Request) {
  try {
    const { name, email, phone, carModel, carColor, course, cardNonce } = await request.json()

    // 1. 顧客を作成
    const { result: customerResult } = await squareClient.customersApi.createCustomer({
      givenName: name,
      emailAddress: email,
      phoneNumber: phone,
      note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}`,
    })

    if (!customerResult.customer || !customerResult.customer.id) {
      throw new Error("顧客の作成に失敗しました")
    }

    const customerId = customerResult.customer.id

    // 2. カード情報を保存
    const { result: cardResult } = await squareClient.cardsApi.createCard({
      idempotencyKey: `${customerId}-${Date.now()}`,
      sourceId: cardNonce,
      card: {
        customerId: customerId,
      },
    })

    if (!cardResult.card || !cardResult.card.id) {
      throw new Error("カード情報の保存に失敗しました")
    }

    return NextResponse.json({
      success: true,
      customerId: customerId,
      cardId: cardResult.card.id,
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

