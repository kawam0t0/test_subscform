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

    const { operation, name, email, phone, carModel, carColor, cardToken, store, course } = formData

    if (operation === "クレジットカード情報変更") {
      // クレジットカード情報変更の場合のみ、既存顧客を検索
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
      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `車種: ${carModel}, 色: ${carColor}`,
        customAttributes: {
          store: { value: store },
        },
      })

      // 新しいカードを作成
      if (cardToken) {
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
      await appendToSheet([
        [new Date().toISOString(), operation, store, name, email, phone, carModel, carColor, customerId],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報が正常に更新されました",
      })
    } else if (operation === "入会") {
      // 新規入会の場合は新しい顧客を作成
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}`,
        customAttributes: {
          store: { value: store },
        },
      })

      if (!customerResult.customer || !customerResult.customer.id) {
        throw new Error("顧客の作成に失敗しました")
      }

      const customerId = customerResult.customer.id

      // カード情報を保存
      if (cardToken) {
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
      }

      // Google Sheetsに新規顧客情報を追加
      await appendToSheet([
        [new Date().toISOString(), operation, store, name, email, phone, carModel, carColor, course, customerId],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報が正常に登録されました",
      })
    }

    throw new Error("不正な操作が指定されました")
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

