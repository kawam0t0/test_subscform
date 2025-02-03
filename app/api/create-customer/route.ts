import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

// リファレンスID生成関数
function generateReferenceId(store: string): string {
  const storePrefix =
    {
      "SPLASH'N'GO!前橋50号店": "001",
      "SPLASH'N'GO!伊勢崎韮塚店": "002",
      "SPLASH'N'GO!高崎棟高店": "003",
      "SPLASH'N'GO!足利緑町店": "004",
      "SPLASH'N'GO!新前橋店": "005",
    }[store] || "000"

  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0")

  return `${storePrefix}${randomPart}`
}

// コース名から金額を除去する関数
function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { name, email, phone, carModel, carColor, course, store, operation } = formData
    const referenceId = generateReferenceId(store)
    const courseName = extractCourseName(course)

    // 新規顧客を作成
    const { result: customerResult } = await squareClient.customersApi.createCustomer({
      idempotencyKey: `${Date.now()}-${Math.random()}`,
      givenName: name,
      familyName: `${carModel}/${carColor}`, // 姓に車種/車の色を設定
      emailAddress: email,
      phoneNumber: phone,
      companyName: store, // 会社名に店舗名を設定
      nickname: courseName, // ニックネームにコース名を設定
      reference_id: referenceId, // リファレンスIDを設定（スネークケースに注意）
      note: `店舗: ${store}\nコース: ${courseName}\n車種: ${carModel}\n車の色: ${carColor}`, // 備考欄に詳細情報を設定
    })

    if (!customerResult.customer || !customerResult.customer.id) {
      throw new Error("顧客の作成に失敗しました")
    }

    const customerId = customerResult.customer.id

    // Google Sheetsに顧客情報を追加
    try {
      const sheetData = [
        [
          new Date().toISOString(), // タイムスタンプ
          store, // 店舗名
          name, // 名前
          email, // メールアドレス
          phone, // 電話番号
          carModel, // 車種
          carColor, // 車の色
          courseName, // コース名
          customerId, // Square顧客ID
          referenceId, // リファレンスID
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
      referenceId: referenceId,
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

