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

    // Square API を使用して顧客を作成
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

    // 支払いリンクの代わりに成功レスポンスを返す
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

