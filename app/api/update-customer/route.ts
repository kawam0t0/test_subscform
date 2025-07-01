import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { sendInquiryConfirmationEmail } from "../../utils/email-sender"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractIdentifierAndModel(familyName: string): { identifier: string; model: string } {
  const identifiers = ["CE", "ME", "YK", "MB"]
  for (const id of identifiers) {
    if (familyName.startsWith(id)) {
      const remainingPart = familyName.slice(id.length)
      const model = remainingPart.split("/")[0].trim()
      return { identifier: id, model }
    }
  }

  // 「車種/姓」の形式かどうかをチェック
  const parts = familyName.split("/")
  if (parts.length > 1) {
    return { identifier: "", model: parts[0].trim() }
  }

  return { identifier: "", model: familyName }
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      operation,
      familyName,
      givenName,
      email,
      phone,
      store,
      currentCourse,
      newCourse,
      carModel,
      carColor,
      cardToken,
      newCarModel,
      newCarColor,
      newEmail,
      membershipNumber, // 会員番号を追加
    } = formData

    // メールアドレスで検索
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    // 電話番号で検索
    const { result: phoneSearchResult } = !emailSearchResult.customers?.length
      ? await squareClient.customersApi.searchCustomers({
          query: {
            filter: {
              phoneNumber: {
                exact: phone,
              },
            },
          },
        })
      : { result: { customers: [] } }

    const matchingCustomer = emailSearchResult.customers?.[0] || phoneSearchResult.customers?.[0]

    if (!matchingCustomer || !matchingCustomer.id) {
      throw new Error("指定されたメールアドレスまたは電話番号に一致する顧客が見つかりません")
    }

    const customerId = matchingCustomer.id

    // 既存の車種情報を取得
    let existingCarModel = carModel

    // matchingCustomerのcompanyNameから車種を取得（形式は「車種/色」を想定）
    if (matchingCustomer.companyName) {
      const companyParts = matchingCustomer.companyName.split("/")
      if (companyParts.length > 0) {
        existingCarModel = companyParts[0].trim()
      }
    }

    // familyNameから車種を取得（形式は「車種/姓」を想定）- 既存データとの互換性のため
    if (!existingCarModel && matchingCustomer.familyName) {
      const { model } = extractIdentifierAndModel(matchingCustomer.familyName)
      if (model && model !== matchingCustomer.familyName) {
        existingCarModel = model
      }
    }

    // 更新データの準備
    const updateData: any = {
      givenName: givenName,
      familyName: familyName, // 姓のみを格納
      emailAddress: operation === "メールアドレス変更" ? newEmail : email,
      phoneNumber: phone,
      note: store,
    }

    // 操作タイプに応じてcompanyNameを設定
    if (operation === "登録車両変更") {
      // 登録車両変更の場合、companyNameに新しい車両詳細を設定（車種/色形式）
      updateData.companyName = `${newCarModel}/${newCarColor}`
    } else {
      // その他の操作の場合、既存の車両情報を保持
      if (matchingCustomer.companyName) {
        updateData.companyName = matchingCustomer.companyName
      } else if (carModel && carColor) {
        updateData.companyName = `${carModel}/${carColor}`
      }
    }

    // コース変更時
    if (operation === "洗車コース変更") {
      updateData.note = `${store}, コース: ${newCourse.split("（")[0].trim()}`
    }

    // 顧客情報を更新
    const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, updateData)

    // クレジットカード情報の更新
    if (operation === "クレジットカード情報変更" && cardToken) {
      const { result: existingCards } = await squareClient.cardsApi.listCards()
      const customerCards = existingCards.cards?.filter((card) => card.customerId === customerId) || []

      // 既存のカードを無効化
      for (const card of customerCards) {
        if (card.id) {
          await squareClient.cardsApi.disableCard(card.id)
        }
      }

      // 新しいカードを追加
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
    }

    // Google Sheetsにデータを追加
    const sheetData = [
      formatJapanDateTime(new Date()), // A列
      operation, // B列
      matchingCustomer.referenceId || "", // C列
      store, // D列
      `${familyName} ${givenName}`, // E列
      email, // F列
      operation === "メールアドレス変更" ? newEmail : "", // G列
      phone, // H列
      carModel || newCarModel || existingCarModel, // I列
      carColor || newCarColor, // J列
      "", // K列: ナンバー（削除済み）
      currentCourse || "", // L列
      newCarModel || "", // M列
      newCarColor || "", // N列
      "", // O列: 新しいナンバープレート（削除済み）
      newCourse || "", // P列
      "", // Q列: その他（submit-inquiryで利用）
      "", // R列: 空白
      membershipNumber || "", // S列: 会員番号
    ]
    await appendToSheet([sheetData])

    // 問い合わせ確認メールを送信
    try {
      const details: any = {}

      if (operation === "登録車両変更") {
        details.newCarModel = newCarModel
        details.newCarColor = newCarColor
      } else if (operation === "洗車コース変更") {
        details.currentCourse = currentCourse
        details.newCourse = newCourse
      } else if (operation === "メールアドレス変更") {
        details.newEmail = newEmail
      }

      await sendInquiryConfirmationEmail(
        `${familyName} ${givenName}`, // 姓名をそのまま使用
        operation === "メールアドレス変更" ? newEmail : email, // 新しいメールアドレスに送信
        operation,
        store,
        details,
      )
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      // メール送信エラーは処理を中断しない
    }

    return NextResponse.json({
      success: true,
      customerId: customerId,
      message: "顧客情報が正常に更新されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
