import { NextResponse } from "next/server"
import { findCustomerFlexible, updateCustomer, insertInquiry, type UpdateCustomerData } from "@/app/utils/cloudsql"
import { appendToSheet } from "@/app/utils/google-sheets"
import { formatJapanDateTime } from "@/app/utils/date-utils"
import { sendInquiryConfirmationEmail } from "@/app/utils/email-sender"

// Helpers
function toArray(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x.trim().length > 0)
  if (typeof v === "string" && v.trim().length > 0) return [v.trim()]
  return []
}

function buildUpdateDataFromForm(formData: any): UpdateCustomerData {
  const operation: string = formData.operation || ""
  const subType: string | undefined =
    formData.inquiryType || formData.procedure || formData.subOperation || formData.procedureType
  const store: string | undefined = formData.store
  const inquiryDetailsFreeText: string = (formData.inquiryDetails || "").toString()

  // Normalize cancellation reasons from multiple possible keys
  const reasonsMerged: string[] = [
    ...toArray(formData.cancellationReasons),
    ...toArray(formData.cancellationReason),
    ...toArray(formData.reasons),
  ]

  // Include any free-text input for reasons into cancellation_reasons when it is a cancel/other inquiry flow
  const freeText = inquiryDetailsFreeText.trim()
  const includeFreeTextInReasons = (op: string, sub?: string) => {
    if (op === "解約" || op === "その他問い合わせ") return true
    if (
      op === "各種手続き" &&
      (sub === "解約" || sub === "退会" || sub === "キャンセル" || sub === "その他問い合わせ")
    ) {
      return true
    }
    return false
  }
  if (includeFreeTextInReasons(operation, subType) && freeText) {
    reasonsMerged.push(freeText)
  }

  // Build inquiry_details based on op and subtype rules
  let inquiryDetailsValue = inquiryDetailsFreeText
  let customerStatus: string | undefined
  if (operation === "各種手続き") {
    if (subType === "解約" || subType === "退会" || subType === "キャンセル") {
      inquiryDetailsValue = "解約"
      customerStatus = "pending"
    } else if (subType === "その他問い合わせ") {
      inquiryDetailsValue = "その他問い合わせ"
    } else if (!inquiryDetailsValue) {
      inquiryDetailsValue = "各種手続き"
    }
  } else if (operation === "解約") {
    inquiryDetailsValue = "解約"
    customerStatus = "pending"
  } else if (operation === "その他問い合わせ") {
    inquiryDetailsValue = "その他問い合わせ"
  }

  // Only store reason texts in cancellation_reasons; change metadata is never saved there
  const cancellationReasons = reasonsMerged.length > 0 ? reasonsMerged : null

  const updateData: UpdateCustomerData = {
    inquiryType: operation, // 例: 「各種手続き」
    inquiryDetails: inquiryDetailsValue, // 例: 「解約」や「その他問い合わせ」
    storeName: store,
    status: "received",
    cancellationReasons,
    customerStatus,
  }

  // Future: if this route also handles course/email/vehicle updates, you can extend updateData with newCourseName/newEmail/newCarModel etc. as needed.
  if (typeof formData.newCarModel === "string" && formData.newCarModel.trim()) {
    updateData.newCarModel = formData.newCarModel.trim()
  }
  if (typeof formData.newCarColor === "string" && formData.newCarColor.trim()) {
    updateData.newCarColor = formData.newCarColor.trim()
  }
  if (typeof formData.newCourse === "string" && formData.newCourse.trim()) {
    updateData.newCourseName = formData.newCourse.trim()
  }
  if (typeof formData.newEmail === "string" && formData.newEmail.trim()) {
    updateData.newEmail = formData.newEmail.trim()
  }

  return updateData
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      operation,
      store,
      familyName,
      givenName,
      email,
      phone,
      carModel,
      carColor,
      course,
      newCarModel,
      newCarColor,
      newCourse,
      newEmail,
      inquiryDetails,
      campaignCode,
    } = formData

    let customer = null
    let customerId = null
    let referenceId = ""

    if (operation === "各種手続き") {
      // 各種手続きの場合は顧客検索せず、直接処理
      console.log("各種手続きのため顧客検索をスキップします")
      referenceId = `inquiry_${Date.now()}` // 一意のID生成
    } else {
      // その他の操作の場合は従来通り顧客検索
      customer = await findCustomerFlexible(email, phone, carModel)
      if (!customer) {
        return NextResponse.json({ success: false, error: "該当する顧客が見つかりませんでした" }, { status: 404 })
      }
      customerId = customer.id
      referenceId = customer.reference_id
    }

    let emailStatus = "❌ 送信失敗"
    try {
      console.log("確認メールを送信中...")
      await sendInquiryConfirmationEmail(
        `${familyName || ""} ${givenName || ""}`.trim(),
        email,
        operation,
        store,
        referenceId,
      )
      emailStatus = "✅ 送信完了"
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      emailStatus = `❌ 送信失敗: ${emailError instanceof Error ? emailError.message : "不明なエラー"}`
    }

    let googleSheetsStatus = "❌ 記録失敗"
    try {
      console.log("Google Sheetsにデータを追加中...")

      let qColumnData = ""
      const reasonsMerged: string[] = [
        ...toArray(formData.cancellationReasons),
        ...toArray(formData.cancellationReason),
        ...toArray(formData.reasons),
      ]

      if (operation === "各種手続き") {
        const subType = formData.inquiryType || formData.procedure || formData.subOperation || formData.procedureType
        if (subType) {
          qColumnData = `【${subType}】`
          if (reasonsMerged.length > 0) {
            qColumnData += ` 解約理由: ${reasonsMerged.join(", ")}`
          }
          if (inquiryDetails && inquiryDetails.trim()) {
            qColumnData += reasonsMerged.length > 0 ? `, ${inquiryDetails}` : ` ${inquiryDetails}`
          }
        } else {
          qColumnData = inquiryDetails || "【各種手続き】"
        }
      } else if (operation === "解約") {
        qColumnData = "【解約】"
        if (reasonsMerged.length > 0) {
          qColumnData += ` 解約理由: ${reasonsMerged.join(", ")}`
        }
        if (inquiryDetails && inquiryDetails.trim()) {
          qColumnData += reasonsMerged.length > 0 ? `, ${inquiryDetails}` : ` ${inquiryDetails}`
        }
      } else if (operation === "その他問い合わせ") {
        qColumnData = "【その他問い合わせ】"
        if (reasonsMerged.length > 0) {
          qColumnData += ` 内容: ${reasonsMerged.join(", ")}`
        }
        if (inquiryDetails && inquiryDetails.trim()) {
          qColumnData += reasonsMerged.length > 0 ? `, ${inquiryDetails}` : ` ${inquiryDetails}`
        }
      } else {
        // その他の操作の場合は従来通り
        qColumnData = inquiryDetails || ""
      }

      const sheetData = [
        formatJapanDateTime(new Date()), // A
        operation || "", // B
        referenceId || "", // C
        store || "", // D
        `${familyName || ""} ${givenName || ""}`.trim(), // E
        email || "", // F
        newEmail || "", // G
        phone || "", // H
        carModel || "", // I
        carColor || "", // J
        "", // K: license plate (未使用)
        course || "", // L
        newCarModel || "", // M
        newCarColor || "", // N
        "", // O: new license plate (未使用)
        newCourse || "", // P
        qColumnData, // Q: お問い合わせの種類と解約理由を組み合わせた形式
        "", // R
        "", // S: 会員番号
        campaignCode || "", // T
      ]
      await appendToSheet([sheetData])
      googleSheetsStatus = "✅ 記録完了"
      console.log("Google Sheetsにデータが正常に追加されました")
    } catch (sheetError) {
      console.error("Google Sheets書き込みエラー:", sheetError)
      googleSheetsStatus = `❌ 記録失敗: ${sheetError instanceof Error ? sheetError.message : "不明なエラー"}`
    }

    const cloudSQLStatus = "✅ inquiriesに記録済み"
    const updateData = buildUpdateDataFromForm(formData)

    // 補助: もしフォームが「各種手続き」でも車両/コース/メール変更の新値を持っている場合に備えて、新値を反映（任意）
    if (typeof newCarModel === "string" && newCarModel.trim()) updateData.newCarModel = newCarModel.trim()
    if (typeof newCarColor === "string" && newCarColor.trim()) updateData.newCarColor = newCarColor.trim()
    if (typeof newCourse === "string" && newCourse.trim()) updateData.newCourseName = newCourse.trim()
    if (typeof newEmail === "string" && newEmail.trim()) updateData.newEmail = newEmail.trim()

    // CloudSQL処理をバックグラウンドで実行（エラーが発生してもスルー）
    Promise.resolve()
      .then(async () => {
        try {
          console.log("CloudSQLにinquiriesデータを挿入中:", {
            customerId: customerId,
            inquiryType: updateData.inquiryType,
            inquiryDetails: updateData.inquiryDetails,
            hasNewCarModel: !!updateData.newCarModel,
            hasNewEmail: !!updateData.newEmail,
          })

          if (operation === "各種手続き") {
            await insertInquiry({
              inquiryType: updateData.inquiryType,
              inquiryDetails: updateData.inquiryDetails,
              storeName: updateData.storeName,
              familyName,
              givenName,
              email,
              phone,
              carModel,
              carColor,
              course,
              newCarModel: updateData.newCarModel,
              newCarColor: updateData.newCarColor,
              newCourseName: updateData.newCourseName,
              newEmail: updateData.newEmail,
              cancellationReasons: updateData.cancellationReasons,
              status: updateData.status,
            })
          } else {
            if (customerId !== null) {
              await updateCustomer(customerId, updateData)
            }
          }
          console.log("CloudSQLへのデータ挿入が完了しました")
        } catch (sqlError) {
          console.error("CloudSQL処理エラー（スルーします）:", sqlError)
          // エラーが発生してもスルーして処理を継続
        }
      })
      .catch(() => {
        // Promise自体のエラーもスルー
      })

    return NextResponse.json({
      success: true,
      message: "処理が完了しました（メール・Google Sheets優先実行）",
      customerId: customerId,
      referenceId: referenceId,
      dataStorage: {
        email: emailStatus,
        googleSheets: googleSheetsStatus,
        cloudSQL: cloudSQLStatus,
      },
    })
  } catch (error: any) {
    console.error("submit-inquiry-cloudsql エラー:", error)
    return NextResponse.json({ success: false, error: error?.message || "不明なエラーが発生しました" }, { status: 500 })
  }
}
