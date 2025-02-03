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

    // 入会の場合のみ特別な処理を行う
    if (operation === "入会") {
      const referenceId = generateReferenceId(store)
      const courseName = extractCourseName(course)

      // デバッグ用のログ
      console.log("Creating customer with data:", {
        name,
        familyName: `${carModel}/${carColor}`,
        email,
        phone,
        referenceId,
        courseName,
        store,
      })

      // 新規顧客を作成
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        idempotencyKey: `${Date.now()}-${Math.random()}`,
        givenName: name,
        familyName: `${carModel}/${carColor}`, // 車種/車の色を姓として設定
        emailAddress: email,
        phoneNumber: phone,
        referenceId: referenceId, // リファレンスIDを設定
        note: courseName, // コース名をノートとして設定
        companyName: store, // 店舗名を会社名として設定
      })

      if (!customerResult.customer || !customerResult.customer.id) {
        throw new Error("顧客の作成に失敗しました")
      }

      const customerId = customerResult.customer.id

      // Google Sheetsに顧客情報を追加
      try {
        const sheetData = [
          [
            new Date().toISOString(),
            store,
            name,
            email,
            phone,
            carModel,
            carColor,
            courseName,
            customerId,
            referenceId,
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
    } else {
      // 入会以外の操作の場合は別の処理を行う（既存の処理をここに移動）
      return NextResponse.json({
        success: false,
        error: "この操作は入会フロー以外では利用できません",
      })
    }
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

