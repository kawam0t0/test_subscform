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
      // 識別子を見つけた場合、残りの部分から車種のみを抽出
      const remainingPart = familyName.slice(id.length)
      const model = remainingPart.split("/")[0].trim()
      return { identifier: id, model }
    }
  }
  // 識別子がない場合は、スラッシュで区切られた最初の部分を車種として扱う
  const model = familyName.split("/")[0].trim()
  return { identifier: "", model }
}

function formatVehicleDetails(model: string, color: string, plate: string): string {
  return `車両詳細: 車種=${model}, 色=${color}, ナンバー=${plate}`
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
    const { identifier } = extractIdentifierAndModel(matchingCustomer?.familyName || "")

    // 各操作に応じて更新するデータを準備
    const updateData: any = {
      givenName: name,
      emailAddress: operation === "メールアドレス変更" ? newEmail : email,
      phoneNumber: phone,
    }

    // 車両情報の更新（入会時と車両変更時）
    if (operation === "入会" || operation === "登録車両変更") {
      const targetModel = newCarModel || carModel
      const targetColor = newCarColor || carColor
      const targetPlate = newLicensePlate || licensePlate

      // familyNameには識別子と車種のみを設定
      updateData.familyName = `${identifier}${targetModel}`

      // noteフィールドに車両詳細とコース情報を設定
      const vehicleDetails = formatVehicleDetails(targetModel, targetColor, targetPlate)
      const existingCourse = extractExistingCourse(matchingCustomer.note)
      updateData.note = `店舗: ${store}, ${vehicleDetails}, コース: ${existingCourse}`
    }
    // コース変更時
    else if (operation === "洗車コース変更") {
      const newCourseName = newCourse.split("（")[0].trim()
      const existingNote = matchingCustomer.note || ""
      updateData.note = existingNote.replace(/コース: .+?(,|$)/, `コース: ${newCourseName}$1`)
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
      name,
      email,
      newEmail || email,
      phone,
      carModel || newCarModel,
      carColor || newCarColor,
      licensePlate || newLicensePlate,
      currentCourse || "",
      newCarModel || "",
      newCarColor || "",
      newLicensePlate || "",
      newCourse || "",
      "",
    ]
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

