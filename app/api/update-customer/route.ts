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

    if (!existingCustomer) {
      throw new Error("顧客が見つかりません")
    }

    const customerId = existingCustomer.id

    if (operation === "登録車両変更") {
      // 既存の顧客情報を取得して保持すべき情報を維持
      const { result: customerResult } = await squareClient.customersApi.retrieveCustomer(customerId)
      const currentCustomer = customerResult.customer

      if (!currentCustomer) {
        throw new Error("顧客情報の取得に失敗しました")
      }

      // 顧客情報を更新（既存の情報を保持しながら車両情報のみ更新）
      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        familyName: `${newCarModel}/${newCarColor}`, // 新しい車両情報を姓として更新
        emailAddress: email,
        phoneNumber: phone,
        companyName: currentCustomer.companyName, // 既存の店舗情報を保持
        nickname: currentCustomer.nickname, // 既存のコース情報を保持
        referenceId: currentCustomer.referenceId, // 既存のリファレンスIDを保持
        note: `
店舗: ${store}
コース: ${currentCustomer.nickname || ""}
車種: ${newCarModel}
車の色: ${newCarColor}
        `.trim(),
      })

      console.log("顧客情報が更新されました:", updateResult.customer)

      // Google Sheetsに更新情報を追加
      await appendToSheet([
        [
          new Date().toISOString(),
          operation,
          store,
          name,
          email,
          phone,
          newCarModel,
          newCarColor,
          customerId,
          currentCustomer.referenceId || "",
        ],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報が正常に更新されました",
      })
    } else if (operation === "クレジットカード情報変更") {
      // クレジットカード情報変更の場合のみ、既存顧客を検索

      // 顧客情報を更新
      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `車種: ${carModel}, 色: ${carColor}, 店舗: ${store}`,
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
        note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}, 店舗: ${store}`,
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

