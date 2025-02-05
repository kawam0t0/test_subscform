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
      // 識別子がある場合は、残りの部分から車種のみを抽出
      const remainingPart = familyName.slice(id.length)
      // スラッシュで区切られている場合は最初の部分のみを使用
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

function formatVehicleDetailsForCompany(model: string, color: string, plate: string): string {
  return `${model}/${color}/${plate}`
}

function extractVehicleDetailsFromNote(note: string): { model: string; color: string; plate: string } {
  const regex = /車両詳細: 車種=(.+?), 色=(.+?), ナンバー=(.+?)(?:,|$)/
  const match = note.match(regex)
  if (match) {
    return { model: match[1], color: match[2], plate: match[3] }
  }
  return { model: "", color: "", plate: "" }
}

function constructFamilyName(identifier: string, model: string): string {
  return identifier ? `${identifier}${model}` : model
}

function constructNote(store: string, model: string, color: string, plate: string, course: string): string {
  const vehicleDetails = formatVehicleDetails(model, color, plate)
  return `店舗: ${store}, ${vehicleDetails}${course ? `, コース: ${course}` : ""}`
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

      // familyNameには識別子（存在する場合）と車種のみを設定
      updateData.familyName = constructFamilyName(identifier, targetModel)

      // companyNameに車両詳細を設定
      updateData.companyName = formatVehicleDetailsForCompany(targetModel, targetColor, targetPlate)

      // noteフィールドに店舗名とコース情報を設定
      const existingCourse = extractExistingCourse(matchingCustomer.note)
      updateData.note = `店舗: ${store}${existingCourse ? `, コース: ${existingCourse}` : ""}`
    }
    // コース変更時
    else if (operation === "洗車コース変更") {
      const newCourseName = newCourse.split("（")[0].trim()
      // 既存のnoteからコース情報のみを更新
      updateData.note = `店舗: ${store}, コース: ${newCourseName}`
    }
    // その他の操作（メールアドレス変更、クレジットカード情報変更など）
    else {
      // 既存の車両情報を保持
      updateData.familyName = matchingCustomer.familyName
      updateData.companyName = matchingCustomer.companyName

      // 既存のnoteから店舗名とコース情報を抽出して保持
      const existingStore = matchingCustomer.note?.match(/店舗: (.+?)(?:,|$)/)?.[1] || store
      const existingCourse = extractExistingCourse(matchingCustomer.note)
      updateData.note = `店舗: ${existingStore}${existingCourse ? `, コース: ${existingCourse}` : ""}`
    }

    // 既存のnoteに車両詳細が含まれている場合、companyNameに移動
    if (matchingCustomer.note && matchingCustomer.note.includes("車両詳細:")) {
      const { model, color, plate } = extractVehicleDetailsFromNote(matchingCustomer.note)
      updateData.companyName = formatVehicleDetailsForCompany(model, color, plate)
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

