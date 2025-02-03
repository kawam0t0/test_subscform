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
      console.log("Square API リクエストデータ作成:", {
        name,
        carInfo: `${carModel}/${carColor}`,
        referenceId,
        courseName,
      })

      try {
        // Square API呼び出し - より詳細な顧客情報の設定
        const { result } = await squareClient.customersApi.createCustomer({
          idempotencyKey: `${Date.now()}-${Math.random()}`,
          givenName: name,
          emailAddress: email,
          phoneNumber: phone,
          address: {
            addressLine1: `${carModel}/${carColor}`, // 車種/車の色を住所1行目に保存
          },
          companyName: store, // 店舗名を会社名として保存
          nickname: courseName, // コース名をニックネームとして保存
          referenceId: referenceId, // リファレンスID
          note: `
店舗: ${store}
コース: ${courseName}
車種: ${carModel}
車の色: ${carColor}
リファレンスID: ${referenceId}
          `.trim(), // 全情報をノートとしても保存
        })

        console.log("Square API レスポンス:", result)

        if (!result.customer?.id) {
          throw new Error("顧客の作成に失敗しました")
        }

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
      } catch (squareError) {
        console.error("Square API エラー詳細:", squareError)
        throw squareError
      }
    }

    // 入会以外の操作の場合
    return NextResponse.json({
      success: false,
      error: "この操作は入会フロー以外では利用できません",
    })
  } catch (error) {
    console.error("エラー発生:", error)
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

