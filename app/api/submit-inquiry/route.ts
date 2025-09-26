import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { sendInquiryConfirmationEmail } from "../../utils/email-sender"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

// 車種/色 → "車種/色"
function buildCompanyName(model?: string, color?: string): string | undefined {
  const m = (model || "").trim()
  const c = (color || "").trim()
  if (m && c) return `${m}/${c}`
  if (m) return m
  if (c) return c
  return undefined
}

// 氏名（姓）に「車種/姓」をセットするためのヘルパー
function buildFamilyNameWithModel(familyName?: string, model?: string): string | undefined {
  const f = (familyName || "").trim()
  const m = (model || "").trim()
  if (!f) return undefined
  const composed = m ? `${m}/${f}` : f
  return composed.slice(0, 255)
}

function toArray(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x.trim().length > 0)
  if (typeof v === "string" && v.trim().length > 0) return [v.trim()]
  return []
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
      cardToken,
      cancellationReasons,
      cancellationReason,
      reasons,
      procedure,
      procedureType,
      subOperation,
      inquiryType,
    } = formData

    const reasonsMerged: string[] = [
      ...toArray(cancellationReasons),
      ...toArray(cancellationReason),
      ...toArray(reasons),
    ]

    const procedureVal: string | undefined =
      (typeof procedure === "string" && procedure) ||
      (typeof procedureType === "string" && procedureType) ||
      (typeof subOperation === "string" && subOperation) ||
      (typeof inquiryType === "string" && inquiryType) ||
      undefined

    let squareCustomerId: string | undefined = undefined
    let referenceId = `inquiry_${Date.now()}`

    if (
      operation === "メールアドレス変更" ||
      operation === "クレジットカード情報変更" ||
      operation === "登録車両変更"
    ) {
      console.log("Square上でメールアドレスによる顧客検索を実行中...")
      try {
        const customersApi = squareClient.customersApi
        const { result: searchResult } = await customersApi.searchCustomers({
          query: {
            filter: {
              emailAddress: {
                exact: email,
              },
            },
          },
        })

        if (searchResult.customers && searchResult.customers.length > 0) {
          const squareCustomer = searchResult.customers[0]
          squareCustomerId = squareCustomer.id
          referenceId = squareCustomer.referenceId || referenceId
          console.log("Square上で顧客が見つかりました:", squareCustomerId)

          const { result: existingCustomer } = await customersApi.retrieveCustomer(squareCustomerId)

          let companyNameCandidate: string | undefined
          let familyNameForSquare: string | undefined

          if (operation === "登録車両変更") {
            companyNameCandidate = buildCompanyName(newCarModel, newCarColor)
            familyNameForSquare = buildFamilyNameWithModel(familyName, newCarModel)
          } else {
            familyNameForSquare = buildFamilyNameWithModel(familyName, carModel)
            companyNameCandidate = buildCompanyName(carModel, carColor)
          }

          const updatePayload: any = {
            givenName: givenName || existingCustomer.customer?.givenName,
            familyName: familyNameForSquare ?? familyName ?? existingCustomer.customer?.familyName,
            emailAddress:
              operation === "メールアドレス変更" ? newEmail || email : email || existingCustomer.customer?.emailAddress,
            phoneNumber: phone || existingCustomer.customer?.phoneNumber,
            note: store || existingCustomer.customer?.note,
          }

          if (operation === "登録車両変更" && companyNameCandidate) {
            updatePayload.companyName = companyNameCandidate
          } else if (existingCustomer.customer?.companyName) {
            updatePayload.companyName = existingCustomer.customer.companyName
          }

          console.log("Square.updateCustomer payload:", updatePayload)
          await customersApi.updateCustomer(squareCustomerId, updatePayload)
          console.log("Square顧客情報が正常に更新されました")
        } else {
          console.log("Square上で顧客が見つかりませんでした")
        }
      } catch (squareSearchError) {
        console.error("Square顧客検索エラー:", squareSearchError)
      }
    }

    if (operation === "クレジットカード情報変更" && squareCustomerId && cardToken) {
      try {
        const cardsApi = squareClient.cardsApi
        const { result: cardResult } = await cardsApi.createCard({
          idempotencyKey: `card-${squareCustomerId}-${Date.now()}`,
          sourceId: cardToken,
          card: {
            customerId: squareCustomerId,
          },
        })
        console.log("Square: 新カード作成完了", cardResult.card?.id)

        // 既存カードを無効化
        try {
          const { result: listRes } = await cardsApi.listCards(undefined, undefined, false, undefined, squareCustomerId)
          const existing = listRes.cards || []
          for (const c of existing) {
            if (c.id && c.id !== cardResult.card?.id) {
              try {
                await cardsApi.disableCard(c.id)
                console.log("Square: 旧カードを無効化:", c.id)
              } catch (e) {
                console.warn("Square: 旧カードの無効化で警告:", e)
              }
            }
          }
        } catch (disableErr) {
          console.warn("Square: 旧カードの無効化に失敗:", disableErr)
        }
      } catch (cardError) {
        console.error("Square: カード作成エラー:", cardError)
        if (cardError instanceof ApiError) {
          const errorDetails = cardError.errors?.[0]
          if (errorDetails?.code === "INVALID_CARD_DATA") {
            return NextResponse.json(
              {
                success: false,
                error: "無効なカード情報です。カード情報を確認して再入力してください。",
                details: errorDetails.detail,
              },
              { status: 400 },
            )
          }
        }
        return NextResponse.json(
          {
            success: false,
            error: "カード情報の更新中にエラーが発生しました。",
          },
          { status: 500 },
        )
      }
    }

    // 確認メール送信
    let emailStatus = "❌ 送信失敗"
    try {
      console.log("確認メール送信中...")
      await sendInquiryConfirmationEmail(`${familyName} ${givenName}`, email, operation, store, referenceId)
      emailStatus = "✅ 送信完了"
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      emailStatus = `❌ 送信失敗: ${emailError instanceof Error ? emailError.message : "不明なエラー"}`
    }

    // Google Sheets書き込み
    let googleSheetsStatus = "❌ 記録失敗"
    try {
      console.log("Google Sheetsにデータを追加中...")

      let qColumnData = ""
      if (operation === "各種手続き" && procedureVal) {
        qColumnData = `【${procedureVal}】`
        if (reasonsMerged.length > 0) {
          qColumnData += ` 解約理由: ${reasonsMerged.join(", ")}`
        }
        if (inquiryDetails && inquiryDetails.trim()) {
          qColumnData += reasonsMerged.length > 0 ? `, ${inquiryDetails}` : ` ${inquiryDetails}`
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
        qColumnData = inquiryDetails || ""
      }

      const sheetData = [
        formatJapanDateTime(new Date()),
        operation || "",
        referenceId || "",
        store || "",
        `${familyName || ""} ${givenName || ""}`.trim(),
        email || "",
        newEmail || "",
        phone || "",
        carModel || "",
        carColor || "",
        "",
        course || "",
        newCarModel || "",
        newCarColor || "",
        "",
        newCourse || "",
        qColumnData,
        "",
        "",
        campaignCode || "",
      ]
      await appendToSheet([sheetData])
      googleSheetsStatus = "✅ 記録完了"
      console.log("Google Sheetsにデータが正常に追加されました")
    } catch (sheetError) {
      console.error("Google Sheets書き込みエラー:", sheetError)
      googleSheetsStatus = `❌ 記録失敗: ${sheetError instanceof Error ? sheetError.message : "不明なエラー"}`
    }

    return NextResponse.json({
      success: true,
      message: "処理が完了しました",
      referenceId: referenceId,
      dataStorage: {
        email: emailStatus,
        googleSheets: googleSheetsStatus,
        square: squareCustomerId ? "✅ 顧客情報更新済" : "— 顧客未検索",
      },
    })
  } catch (error) {
    console.error("submit-inquiry エラー:", error)
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: "Square APIエラー", details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
