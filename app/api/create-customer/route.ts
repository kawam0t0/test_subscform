import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import { sendConfirmationEmail } from "../../utils/email-sender"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

export async function POST(request: Request) {
  let customerId: string | null = null

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
      campaignCode,
    } = formData

    if (operation === "入会") {
      const referenceId = generateReferenceId(store)
      const courseName = extractCourseName(course)

      try {
        // 1. 顧客情報を作成
        console.log("顧客情報を作成中...")
        const { result: customerResult } = await squareClient.customersApi.createCustomer({
          idempotencyKey: `${Date.now()}-${Math.random()}`,
          givenName: givenName,
          familyName: familyName, // 姓のみを格納
          emailAddress: email,
          phoneNumber: phone,
          companyName: `${carModel}/${carColor}`, // 車両情報はcompanyNameに格納
          referenceId: referenceId,
          note: store,
          nickname: courseName,
        })

        if (!customerResult.customer?.id) {
          throw new Error("顧客の作成に失敗しました")
        }

        customerId = customerResult.customer.id
        console.log("顧客情報が作成されました:", customerId)

        // 2. カード情報の処理（存在する場合）
        if (cardToken) {
          try {
            console.log("カード情報を保存中...", { customerId, cardToken: cardToken.substring(0, 10) + "..." })
            const { result: cardResult } = await squareClient.cardsApi.createCard({
              idempotencyKey: `${customerId}-${Date.now()}`,
              sourceId: cardToken,
              card: {
                customerId: customerId,
              },
            })

            if (!cardResult.card || !cardResult.card.id) {
              throw new Error("カード情報の保存に失敗しました")
            }

            console.log("カード情報が正常に保存されました:", cardResult.card.id)
          } catch (cardError) {
            console.error("カード処理エラー:", cardError)

            // カードエラーが発生した場合、作成した顧客情報を削除
            if (customerId) {
              try {
                await squareClient.customersApi.deleteCustomer(customerId)
                console.log("カードエラーにより顧客情報を削除しました:", customerId)
                customerId = null
              } catch (deleteError) {
                console.error("顧客削除エラー:", deleteError)
              }
            }

            // APIエラーの場合は詳細なエラーメッセージを取得
            if (cardError instanceof ApiError) {
              const errorDetail = cardError.errors?.[0]?.detail || cardError.message
              const errorCode = cardError.errors?.[0]?.code || ""

              // SOURCE_USEDエラーの場合は特別なメッセージを表示
              if (errorCode === "SOURCE_USED") {
                throw new Error("このカード情報は既に使用されています。ページを更新して再度お試しください。")
              } else {
                throw new Error(`クレジットカードエラー: ${errorDetail}`)
              }
            } else {
              throw new Error("クレジットカード情報が無効です。正しい情報を入力してください。")
            }
          }
        }

        // 3. Google Sheetsにデータを追加
        try {
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
              "", // K列: ナンバー（削除済み）
              courseName, // L列: 洗車コース名
              "", // M列: 新しい車種
              "", // N列: 新しい車の色
              "", // O列: 新しいナンバープレート（削除済み）
              "", // P列: 新しいコース
              "", // Q列: その他
              "", // R列: 空白
              "", // S列: 会員番号 (入会時は空)
              campaignCode || "", // T列: キャンペーンコード
            ],
          ])
          console.log("Google Sheetsにデータが追加されました")
        } catch (sheetError) {
          console.error("Google Sheets書き込みエラー:", sheetError)
          // Sheetsエラーはログに記録するだけで処理を続行
        }

        // 4. メール送信
        try {
          await sendConfirmationEmail(`${familyName} ${givenName}`, email, course, store, referenceId)
          console.log("入会確認メールを送信しました")
        } catch (emailError) {
          console.error("メール送信中にエラーが発生しました:", emailError)
          // メール送信エラーは処理を中断しないが、ログに記録
        }

        return NextResponse.json({
          success: true,
          customerId: customerId,
          referenceId: referenceId,
          message: "顧客情報が正常に登録されました",
        })
      } catch (processingError) {
        // 処理中のエラーが発生した場合、作成した顧客情報を削除
        if (customerId) {
          try {
            await squareClient.customersApi.deleteCustomer(customerId)
            console.log("処理エラーにより顧客情報を削除しました:", customerId)
            customerId = null
          } catch (deleteError) {
            console.error("顧客削除エラー:", deleteError)
          }
        }

        throw processingError
      }
    }

    return NextResponse.json({
      success: false,
      error: "この操作は入会フロー以外では利用できません",
    })
  } catch (error) {
    console.error("エラー発生:", error)

    // 最終的なエラーハンドリング - 顧客情報が残っていれば削除を試みる
    if (customerId) {
      try {
        await squareClient.customersApi.deleteCustomer(customerId)
        console.log("最終エラーハンドリングで顧客情報を削除しました:", customerId)
      } catch (deleteError) {
        console.error("最終エラーハンドリングでの顧客削除エラー:", deleteError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      },
      { status: 500 },
    )
  }
}
