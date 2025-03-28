import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      familyName,
      givenName,
      email,
      phone,
      carModel,
      carColor,
      course,
      store,
      operation,
      cardToken,
      licensePlate,
    } = formData

    if (operation === "入会") {
      const referenceId = generateReferenceId(store)
      const courseName = extractCourseName(course)

      // 1. 顧客情報を作成
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        idempotencyKey: `${Date.now()}-${Math.random()}`,
        givenName: givenName,
        familyName: `${carModel}/${familyName}`, // 車種/姓 の形式に変更
        emailAddress: email,
        phoneNumber: phone,
        companyName: `${carModel}/${carColor}/${licensePlate}`,
        referenceId: referenceId,
        note: store,
        nickname: courseName,
      })

      if (!customerResult.customer?.id) {
        throw new Error("顧客の作成に失敗しました")
      }

      const customerId = customerResult.customer.id

      // 2. カード情報の処理（存在する場合）
      if (cardToken) {
        try {
          const { result: cardResult } = await squareClient.cardsApi.createCard({
            idempotencyKey: `${customerId}-${Date.now()}`,
            sourceId: cardToken,
            card: {
              customerId: customerId,
            },
          })

          if (!cardResult.card || !cardResult.card.id) {
            // カード情報の保存に失敗した場合、作成した顧客情報を削除
            await squareClient.customersApi.deleteCustomer(customerId)
            throw new Error("カード情報の保存に失敗しました")
          }

          console.log("カード情報が正常に保存されました:", cardResult.card.id)
        } catch (cardError) {
          // カードエラーが発生した場合、作成した顧客情報を削除
          console.error("カード処理エラー:", cardError)
          await squareClient.customersApi.deleteCustomer(customerId)

          // APIエラーの場合は詳細なエラーメッセージを取得
          if (cardError instanceof ApiError) {
            const errorDetail = cardError.errors[0]?.detail || cardError.message
            throw new Error(`クレジットカードエラー: ${errorDetail}`)
          } else {
            throw new Error("クレジットカード情報が無効です。正しい情報を入力してください。")
          }
        }
      }

      // 3. Google Sheetsにデータを追加
      await appendToSheet([
        [
          formatJapanDateTime(new Date()), // A列: タイムスタンプ
          operation, // B列: 操作
          referenceId, // C列: リファレンスID
          store, // D列: 店舗
          `${familyName} ${givenName}`, // E列: 名前
          email, // F列: メールアドレス
          "", // G列: 新しいメールアドレス
          phone, // H列: 電話番号
          carModel, // I列: 車種
          carColor, // J列: 車の色
          licensePlate, // K列: ナンバー
          courseName, // L列: 洗車コース名
          "", // M列: 新しい車種
          "", // N列: 新しい車の色
          "", // O列: 新しいナンバープレート
          "", // P列: 新しいコース
          "", // Q列: その他
        ],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        referenceId: referenceId,
        message: "顧客情報が正常に登録されました",
      })
    }

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
      },
      { status: 500 },
    )
  }
}

