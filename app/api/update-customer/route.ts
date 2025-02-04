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

    const { operation, name, email, phone, newCarModel, newCarColor, store, carModel, carColor, course, cardToken } =
      formData

    // メールアドレスで顧客を検索
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    // メールアドレスで見つからない場合は電話番号で検索
    const { result: phoneSearchResult } = !emailSearchResult.customers?.length
      ? await squareClient.customersApi.searchCustomers({
          query: {
            filter: {
              phoneNumber: {
                exact: phone,
              },
            },
          },
        })
      : { result: { customers: [] } }

    const existingCustomer = emailSearchResult.customers?.[0] || phoneSearchResult.customers?.[0]

    if (!existingCustomer || !existingCustomer.id) {
      throw new Error("顧客が見つかりません")
    }

    const customerId = existingCustomer.id

    if (operation === "登録車両変更") {
      // 顧客情報を更新（姓の部分のみ新しい車両情報で更新）
      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        familyName: `${newCarModel}/${newCarColor}`, // 新しい車両情報を姓として更新
        emailAddress: email,
        phoneNumber: phone,
      })

      console.log("顧客情報が更新されました:", updateResult.customer)

      // Google Sheetsに更新情報を追加
      await appendToSheet([
        [new Date().toISOString(), operation, store, name, email, phone, newCarModel, newCarColor, customerId],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報が正常に更新されました",
      })
    } else if (operation === "クレジットカード情報変更") {
      // 顧客情報を更新
      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${course}`, //変更点1
      })

      // 新しいカードを作成
      if (cardToken) {
        // 1. 既存のカードを無効化
        const { result: existingCards } = await squareClient.cardsApi.listCards()
        const customerCards = existingCards.cards?.filter((card) => card.customerId === customerId) || []
        for (const card of customerCards) {
          if (card.id) {
            await squareClient.cardsApi.disableCard(card.id)
            console.log(`古いカードID: ${card.id} を無効化しました`)
          }
        }

        // 2. 新しいカードを追加
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

        console.log("新しいカードが正常に追加され、古いカードは無効化されました")
      }

      // Google Sheetsに更新情報を追加
      await appendToSheet([
        [new Date().toISOString(), operation, store, name, email, phone, store, course, customerId], //変更点2
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報とクレジットカード情報が正常に更新されました",
      })
    }

    return NextResponse.json({
      success: true,
      message: "処理が完了しました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

