import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

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

function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { name, email, phone, carModel, carColor, course, store, operation } = formData

    // 入会フローの場合のみ特別な処理を実行
    if (operation === "入会") {
      const referenceId = generateReferenceId(store)
      const courseName = extractCourseName(course)

      // デバッグログ
      console.log("Square API リクエストデータ:", {
        givenName: name,
        familyName: `${carModel}/${carColor}`,
        referenceId: referenceId,
        note: courseName,
      })

      // Square API呼び出し
      const { result } = await squareClient.customersApi.createCustomer({
        givenName: name,
        familyName: `${carModel}/${carColor}`,
        emailAddress: email,
        phoneNumber: phone,
        referenceId: referenceId,
        note: courseName,
        idempotencyKey: `${Date.now()}-${Math.random()}`,
      })

      if (!result.customer?.id) {
        throw new Error("顧客の作成に失敗しました")
      }

      // 成功時のデバッグログ
      console.log("作成された顧客情報:", result.customer)

      // Google Sheetsへの記録
      await appendToSheet([
        [
          new Date().toISOString(),
          store,
          name,
          email,
          phone,
          carModel,
          carColor,
          courseName,
          result.customer.id,
          referenceId,
        ],
      ])

      return NextResponse.json({
        success: true,
        customerId: result.customer.id,
        referenceId: referenceId,
        message: "顧客情報が正常に登録されました",
      })
    }

    // 入会以外の操作の場合
    return NextResponse.json({
      success: false,
      error: "この操作は入会フロー以外では利用できません",
    })
  } catch (error) {
    console.error("Square API エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
        details: error,
      },
      { status: 500 },
    )
  }
}

