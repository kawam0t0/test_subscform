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

function extractIdentifierAndModel(familyName: string): { identifier: string; model: string } {
  const identifiers = ["CE", "ME", "YK", "MB"]
  for (const id of identifiers) {
    if (familyName.startsWith(id)) {
      return { identifier: id, model: familyName.slice(id.length).split("/")[0] }
    }
  }
  return { identifier: "", model: familyName.split("/")[0] }
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
      phone, // H: 電話番号
      carModel || newCarModel, // I: 車種
      carColor || newCarColor, // J: 車の色
      licensePlate || newLicensePlate, // K: ナンバープレート
      currentCourse || "", // L: 現在のコース
      newCarModel || "", // M: 新しい車種
      newCarColor || "", // N: 新しい車の色
      newLicensePlate || "", // O: 新しいナンバープレート
      newCourse || "", // P: 新ご利用コース
      "", // Q: お問い合わせ内容
    ]

    if (operation === "登録車両変更" || operation === "入会") {
      const { identifier, model } = extractIdentifierAndModel(matchingCustomer?.familyName || "")
      const newFamilyName = `${identifier}${newCarModel || carModel}`
      const vehicleDetails = `車種: ${newCarModel || carModel}, 色: ${newCarColor || carColor}, ナンバー: ${newLicensePlate || licensePlate}`

      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        familyName: newFamilyName,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, ${vehicleDetails}, コース: ${extractExistingCourse(matchingCustomer?.note)}`,
      })

      console.log("顧客情報が更新されました:", updateResult.customer)
    } else if (operation === "洗車コース変更") {
      const newCourseName = newCourse.split("（")[0].trim()
      const existingNote = matchingCustomer?.note || ""
      const updatedNote = existingNote.replace(/コース: .+?(,|$)/, `コース: ${newCourseName}$1`)

      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: updatedNote,
      })
    } else if (operation === "クレジットカード情報変更") {
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
        emailAddress: newEmail,
        phoneNumber: phone,
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

