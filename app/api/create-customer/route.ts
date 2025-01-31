import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { randomUUID } from "crypto"

// スクエアクライアントの初期化
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: Environment.Production, // 本番環境に変更
})

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { store, name, email, phone, carModel, carColor, cardToken, referenceId, course, operation } = formData

    // 入力バリデーション
    const missingFields = []
    if (!store) missingFields.push("store")
    if (!name) missingFields.push("name")
    if (!email) missingFields.push("email")
    if (!phone) missingFields.push("phone")
    if (!carModel) missingFields.push("carModel")
    if (!carColor) missingFields.push("carColor")
    if (operation === "入会" && !cardToken) missingFields.push("cardToken")
    if (!course) missingFields.push("course")
    if (!operation) missingFields.push("operation")

    if (missingFields.length > 0) {
      console.error("必須フィールドが不足しています:", missingFields)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: `必須フィールドが不足しています: ${missingFields.join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // ユニークなidempotency_keyを生成
    const idempotencyKey = randomUUID()

    // referenceIdが無い場合は生成
    const actualReferenceId = referenceId || `${store}-${Date.now()}`

    // Square APIを使用して顧客を作成
    const { result } = await squareClient.customersApi.createCustomer({
      idempotencyKey,
      givenName: name,
      familyName: `${carModel}/${carColor}`,
      emailAddress: email,
      phoneNumber: phone,
      referenceId: actualReferenceId,
      note: `${store}/${course.split("（")[0].trim()}`,
    })

    if (result.customer && result.customer.id) {
      console.log("スクエアに顧客が作成されました:", result.customer.id)

      // カードの登録（新規登録時のみ）
      if (operation === "入会" && cardToken) {
        try {
          const cardIdempotencyKey = randomUUID() // カード登録用の別のユニークなキー
          await squareClient.customersApi.createCustomerCard(result.customer.id, {
            cardNonce: cardToken,
            idempotencyKey: cardIdempotencyKey,
          })
          console.log("カードが正常に登録されました")
        } catch (cardError) {
          console.error("カード登録中にエラーが発生:", cardError)
        }
      }

      // Google Sheetsに顧客情報を追加する部分を修正
      try {
        const sheetData = [
          [
            actualReferenceId, // A列: リファレンスID
            operation, // B列: 操作タイプ
            store, // C列: 店舗名
            "", // D列: コース名（空白に変更）
            "", // E列: 空白
            "", // F列: 空白
            "", // G列: 空白
            name, // H列: 名前
            email, // I列: メールアドレス
            phone, // J列: 電話番号
            carModel, // K列: 車種名
            carColor, // L列: 車の色
          ],
        ]

        await appendToSheet(sheetData)
        console.log("Google Sheetsに顧客情報が追加されました")
      } catch (sheetError) {
        console.error("Google Sheetsへの書き込み中にエラーが発生:", sheetError)
      }

      return new NextResponse(
        JSON.stringify({
          success: true,
          customerId: result.customer.id,
          message: "顧客情報が正常に作成されました",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      )
    } else {
      throw new Error("顧客の作成に失敗しました")
    }
  } catch (error: unknown) {
    console.error("顧客の作成中にエラーが発生:", error)
    const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました"
    return new NextResponse(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

