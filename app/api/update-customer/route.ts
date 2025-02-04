import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"

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
    } = formData

    // メールアドレスで顧客を検索
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    // メールアドレスとナンバープレートで顧客を特定
    const existingCustomers = emailSearchResult.customers || []
    const matchingCustomer = existingCustomers.find(
      (customer) => customer.familyName && customer.familyName.split("/")[2] === licensePlate,
    )

    if (!matchingCustomer || !matchingCustomer.id) {
      throw new Error("指定されたメールアドレスとナンバープレートに一致する顧客が見つかりません")
    }

    const customerId = matchingCustomer.id

    // Google Sheetsに記録するデータを準備
    const sheetData = [
      new Date().toISOString(), // A: タイムスタンプ
      operation, // B: 問い合わせ内容
      store, // C: 入会店舗
      name, // D: お名前
      email, // E: メールアドレス
      phone, // F: 電話番号
      carModel, // G: 車種
      carColor, // H: 車の色
      licensePlate, // I: ナンバープレート
      currentCourse || "", // J: 現在のコース
      newCarModel || "", // K: 新しい車種
      newCarColor || "", // L: 新しい車の色
      newLicensePlate || "", // M: 新しいナンバープレート
      newCourse || "", // N: 新ご利用コース
      "", // O: お問い合わせ内容（更新の場合は空欄）
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

