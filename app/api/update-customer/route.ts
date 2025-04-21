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
  const model = familyName.split("/")[0].trim()
  return { identifier: "", model }
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
      throw new Error("��定されたメールアドレスまたは電話番号に一致する顧客が見つかりません")
    }

    const customerId = matchingCustomer.id
    const { identifier } = extractIdentifierAndModel(matchingCustomer?.familyName || "")

    // 更新データの準備
    const updateData: any = {
      givenName: givenName,
      familyName: familyName, // 常に入力された姓を使用
      emailAddress: operation === "メールアドレス変更" ? newEmail : email,
      phoneNumber: phone,
      note: store,
    }

    // 車両情報の更新（車両変更時）
    if (operation === "登録車両変更") {
      // companyNameに新しい車両詳細を設定（車種/色形式）
      updateData.companyName = `${newCarModel}/${newCarColor}`
    }
    // コース変更時
    else if (operation === "洗車コース変更") {
      // 既存の車両情報を保持
      updateData.companyName = matchingCustomer.companyName
      updateData.note = `${store}, コース: ${newCourse.split("（")[0].trim()}`
    }
    // その他の操作（メールアドレス変更、クレジットカード情報変更など）
    else {
      // 既存の車両情報を保持
      updateData.companyName = matchingCustomer.companyName
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
      formatJapanDateTime(new Date()),
      operation,
      matchingCustomer.referenceId || "",
      store,
      `${familyName} ${givenName}`,
      email,
      operation === "メールアドレス変更" ? newEmail : "",
      phone,
      carModel || newCarModel,
      carColor || newCarColor,
      "", // ナンバープレート（削除済み）
      currentCourse || "",
      newCarModel || "",
      newCarColor || "",
      "", // 新しいナンバープレート（削除済み）
      newCourse || "",
      "",
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
        `${familyName} ${givenName}`,
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
