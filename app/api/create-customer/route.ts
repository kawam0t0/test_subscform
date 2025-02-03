import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { randomUUID } from "crypto"

// スクエアクライアントの初期化
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: Environment.Production,
})

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      store,
      name,
      email,
      phone,
      carModel,
      carColor,
      cardToken,
      referenceId,
      course,
      operation,
      newCarModel,
      newCarColor,
    } = formData

    // 入力バリデーション
    const missingFields = []
    if (!store) missingFields.push("store")
    if (!name) missingFields.push("name")
    if (!email) missingFields.push("email")
    if (!phone) missingFields.push("phone")
    if (!carModel) missingFields.push("carModel")
    if (!carColor) missingFields.push("carColor")
    if (!operation) missingFields.push("operation")

    // 入会時のみ必須
    if (operation === "入会") {
      if (!cardToken) missingFields.push("cardToken")
      if (!course) missingFields.push("course")
    }

    // 登録車両変更時のみ必須
    if (operation === "登録車両変更") {
      if (!newCarModel) missingFields.push("newCarModel")
      if (!newCarColor) missingFields.push("newCarColor")
    }

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

    const idempotencyKey = randomUUID()
    const actualReferenceId = referenceId || `${store}-${Date.now()}`

    // コース名を抽出（括弧内の金額を除く）
    const courseName = course ? course.split("（")[0].trim() : ""

    // Square APIを使用して顧客を作成
    const { result } = await squareClient.customersApi.createCustomer({
      idempotencyKey,
      givenName: name,
      familyName: operation === "登録車両変更" ? `${newCarModel}/${newCarColor}` : `${carModel}/${carColor}`,
      emailAddress: email,
      phoneNumber: phone,
      referenceId: actualReferenceId,
      note: operation === "入会" ? `${store}/${courseName}` : `${store}/車両変更:${carModel}→${newCarModel}`,
    })

    if (result.customer && result.customer.id) {
      console.log("スクエアに顧客が作成されました:", result.customer.id)

      // カードの登録（新規登録時のみ）
      if (operation === "入会" && cardToken) {
        try {
          const cardIdempotencyKey = randomUUID()
          await squareClient.customersApi.createCustomerCard(result.customer.id, {
            cardNonce: cardToken,
            idempotencyKey: cardIdempotencyKey,
          })
          console.log("カードが正常に登録されました")
        } catch (cardError) {
          console.error("カード登録中にエラーが発生:", cardError)
        }
      }

      // Google Sheetsに顧客情報を追加
      try {
        const sheetData = [
          [
            actualReferenceId, // A列: リファレンスID
            operation, // B列: 操作タイプ
            store, // C列: 店舗名
            operation === "入会" ? courseName : "", // D列: コース名（括弧内の金額を除いたもの）
            "", // E列: 空白
            "", // F列: 空白
            "", // G列: 空白
            name, // H列: 名前
            email, // I列: メールアドレス
            phone, // J列: 電話番号
            carModel, // K列: 車種名
            carColor, // L列: 車の色
            operation === "登録車両変更" ? newCarModel : "", // M列: 新しい車種（車両変更時のみ）
            operation === "登録車両変更" ? newCarColor : "", // N列: 新しい車の色（車両変更時のみ）
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

