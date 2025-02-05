import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractExistingCourse(note: string | null | undefined): string {
  if (!note) return ""
  const courseMatch = note.match(/コース: (.+?)(?:,|$)/)
  return courseMatch ? courseMatch[1].trim() : ""
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      operation,
      name,
      email,
      phone,
      store,
      currentCourse,
      newCourse,
      carModel,
      carColor,
      licensePlate,
      cardToken,
      newCarModel,
      newCarColor,
      newLicensePlate,
      newEmail,
    } = formData

    // First try searching by email
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    // If no results found by email, try searching by phone
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

    // Use the first matching customer from either search
    const matchingCustomer = emailSearchResult.customers?.[0] || phoneSearchResult.customers?.[0]

    if (!matchingCustomer || !matchingCustomer.id) {
      throw new Error("指定されたメールアドレスまたは電話番号に一致する顧客が見つかりません")
    }

    const customerId = matchingCustomer.id

    // Google Sheetsに記録するデータを準備
    const sheetData = [
      formatJapanDateTime(new Date()), // A: タイムスタンプ（日本時間）
      operation, // B: 問い合わせ内容
      matchingCustomer.referenceId || "", // C: リファレンスID（Squareから取得）
      store, // D: 入会店舗
      name, // E: お名前
      email, // F: 現在のメールアドレス
      newEmail || email, // G: 新しいメールアドレス（変更がない場合は現在のメールアドレス）
      phone, // H: 電話番号（1列右にシフト）
      carModel, // I: 車種（1列右にシフト）
      carColor, // J: 車の色（1列右にシフト）
      licensePlate, // K: ナンバープレート（1列右にシフト）
      currentCourse || "", // L: 現在のコース（1列右にシフト）
      newCarModel || "", // M: 新しい車種（1列右にシフト）
      newCarColor || "", // N: 新しい車の色（1列右にシフト）
      newLicensePlate || "", // O: 新しいナンバープレート（1列右にシフト）
      newCourse || "", // P: 新ご利用コース（1列右にシフト）
      "", // Q: お問い合わせ内容（1列右にシフト）
    ]

    if (operation === "洗車コース変更") {
      // コース変更の場合は、noteフィールドを新しいコースで更新
      const newCourseName = newCourse.split("（")[0].trim()

      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${newCourseName}`,
      })
    } else if (operation === "登録車両変更") {
      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        familyName: `${newCarModel}/${newCarColor}/${newLicensePlate}`,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${extractExistingCourse(matchingCustomer.note)}`,
      })

      console.log("顧客情報が更新されました:", updateResult.customer)
    } else if (operation === "クレジットカード情報変更") {
      const existingCourse = extractExistingCourse(matchingCustomer.note)

      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${existingCourse}`,
      })

      if (cardToken) {
        const { result: existingCards } = await squareClient.cardsApi.listCards()
        const customerCards = existingCards.cards?.filter((card) => card.customerId === customerId) || []
        for (const card of customerCards) {
          if (card.id) {
            await squareClient.cardsApi.disableCard(card.id)
            console.log(`古いカードID: ${card.id} を無効化しました`)
          }
        }

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

        console.log("新しいカードが正常に追加され、古いカードは無効化されました")
      }
    } else if (operation === "メールアドレス変更") {
      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        familyName: `${carModel}/${carColor}/${licensePlate}`,
        emailAddress: newEmail,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${extractExistingCourse(matchingCustomer.note)}`,
      })

      console.log("メールアドレスが更新されました:", newEmail)
    }

    // Google Sheetsにデータを追加
    await appendToSheet([sheetData])

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

