import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { name, email, phone, carModel, carColor, cardToken, operation } = formData

    // 顧客を検索
    const { result: customerSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    if (!customerSearchResult.customers || customerSearchResult.customers.length === 0) {
      throw new Error("顧客が見つかりません")
    }

    const customerId = customerSearchResult.customers[0].id
    if (!customerId) {
      throw new Error("顧客IDが見つかりません")
    }

    // 顧客情報を更新
    const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
      givenName: name,
      emailAddress: email,
      phoneNumber: phone,
      note: `車種: ${carModel}, 色: ${carColor}`,
    })

    if (operation === "クレジットカード情報変更" && cardToken) {
      // 既存のカード情報を取得して無効化
      try {
        const { result: cardsResult } = await squareClient.customersApi.listCustomerCards(customerId)

        if (cardsResult.cards && cardsResult.cards.length > 0) {
          // 既存のカードを無効化
          for (const card of cardsResult.cards) {
            if (card.id) {
              await squareClient.cardsApi.disableCard(card.id)
              console.log(`既存のカード(${card.id})を無効化しました`)
            }
          }
        }
      } catch (cardError) {
        console.error("既存のカード無効化中にエラーが発生:", cardError)
      }

      // 新しいカードを作成
      const { result: cardResult } = await squareClient.cardsApi.createCard({
        idempotencyKey: `${customerId}-${Date.now()}`,
        sourceId: cardToken,
        card: {
          customerId: customerId,
        },
      })

      if (!cardResult.card || !cardResult.card.id) {
        throw new Error("カード情報の保存に失敗しました")
      }

      console.log("新しいカードが作成されました:", cardResult.card.id)
    }

    // Google Sheetsに更新情報を追加
    try {
      const sheetData = [[new Date().toISOString(), operation, name, email, phone, carModel, carColor, customerId]]

      await appendToSheet(sheetData)
      console.log("Google Sheetsに更新情報が追加されました")
    } catch (sheetError) {
      console.error("Google Sheetsへの書き込み中にエラーが発生:", sheetError)
    }

    return NextResponse.json({
      success: true,
      customerId: customerId,
      message: "顧客情報が正常に更新されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

