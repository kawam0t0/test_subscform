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

    const { name, email, phone, carModel, carColor, course, store, operation, cardToken, licensePlate } = formData

    // 入会フローの場合のみ特別な処理を実行
    if (operation === "入会") {
      const referenceId = generateReferenceId(store)
      const courseName = extractCourseName(course)

      try {
        // 1. まず顧客を作成
        const { result: customerResult } = await squareClient.customersApi.createCustomer({
          idempotencyKey: `${Date.now()}-${Math.random()}`,
          givenName: name,
          familyName: `${carModel}/${carColor}/${licensePlate}`,
          emailAddress: email,
          phoneNumber: phone,
          companyName: store,
          nickname: courseName,
          referenceId: referenceId,
          note: `
店舗: ${store}
コース: ${courseName}
          `.trim(),
        })

        if (!customerResult.customer?.id) {
          throw new Error("顧客の作成に失敗しました")
        }

        // 2. カード情報を保存（cardTokenが存在する場合のみ）
        if (cardToken) {
          const { result: cardResult } = await squareClient.cardsApi.createCard({
            idempotencyKey: `${customerResult.customer.id}-${Date.now()}`,
            sourceId: cardToken,
            card: {
              customerId: customerResult.customer.id,
            },
          })

          if (!cardResult.card || !cardResult.card.id) {
            throw new Error("カード情報の保存に失敗しました")
          }

          console.log("カード情報が正常に保存されました:", cardResult.card.id)
        }

        // Google Sheetsにデータを追加
        await appendToSheet([
          [
            new Date().toISOString(), // A: タイムスタンプ
            operation, // B: 問い合わせ内容
            store, // C: 入会店舗
            name, // D: お名前
            email, // E: メールアドレス
            phone, // F: 電話番号
            carModel, // G: 車種
            carColor, // H: 車の色
            licensePlate, // I: ナンバープレート
            courseName, // J: 入会コース
            "", // K: 新しい車種
            "", // L: 新しい車の色
            "", // M: 新しいナンバープレート
            "", // N: 新ご利用コース
            "", // O: お問い合わせ内容
          ],
        ])

        return NextResponse.json({
          success: true,
          customerId: customerResult.customer.id,
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

