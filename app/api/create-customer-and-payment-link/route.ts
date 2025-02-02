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

    const { name, email, phone, carModel, carColor, course, store } = formData

    // 既存の顧客を検索
    const { result: searchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
          // または電話番号で検索
          or: {
            phoneNumber: {
              exact: phone,
            },
          },
        },
      },
    })

    let customerId: string

    if (searchResult.customers && searchResult.customers.length > 0) {
      // 既存の顧客を更新
      const existingCustomer = searchResult.customers[0]
      customerId = existingCustomer.id

      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}, 店舗: ${store}`,
      })

      console.log("既存の顧客を更新しました:", updateResult.customer?.id)
    } else {
      // 新規顧客を作成
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}, 店舗: ${store}`,
      })

      if (!customerResult.customer || !customerResult.customer.id) {
        throw new Error("顧客の作成に失敗しました")
      }

      customerId = customerResult.customer.id
      console.log("新規顧客を作成しました:", customerId)
    }

    // Google Sheetsに顧客情報を追加
    try {
      const sheetData = [
        [
          new Date().toISOString(), // A列: タイムスタンプ
          store, // B列: 店舗名
          name, // C列: 名前
          email, // D列: メールアドレス
          phone, // E列: 電話番号
          carModel, // F列: 車種
          carColor, // G列: 車の色
          course, // H列: コース
          customerId, // I列: Square顧客ID
        ],
      ]

      await appendToSheet(sheetData)
      console.log("Google Sheetsに顧客情報が追加されました")
    } catch (sheetError) {
      console.error("Google Sheetsへの書き込み中にエラーが発生:", sheetError)
    }

    return NextResponse.json({
      success: true,
      customerId: customerId,
      message: "顧客情報が正常に登録されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

