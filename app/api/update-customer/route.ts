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

// Squareのidempotency_keyは最大45文字
function generateIdempotencyKey(prefix = "cu"): string {
  const ts = Date.now().toString(36) // 短いタイムスタンプ
  const rand = Math.random().toString(36).slice(2, 10) // 8文字
  const base = `${prefix}-${ts}-${rand}`
  return base.slice(0, 45) // 安全のため断裁
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { familyName, givenName, email, operation } = formData

    let emailStatus = "❌ 送信失敗"
    try {
      console.log("確認メール送信を開始します...")
      await sendInquiryConfirmationEmail(
        `${familyName} ${givenName}`,
        email,
        operation,
        "", // reference_idは空文字
      )
      emailStatus = "✅ 送信完了"
      console.log("✅ 問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("❌ メール送信中にエラーが発生しました:", emailError)
      emailStatus = `❌ 送信失敗: ${emailError instanceof Error ? emailError.message : "不明なエラー"}`
    }

    const {
      campaignCode,
      phone,
      carModel,
      carColor,
      course,
      newCarModel,
      newCarColor,
      newCourse,
      newEmail,
      inquiryDetails,
      cardToken,
      cancellationReasons,
      cancellationReason,
      reasons,
      procedure,
      procedureType,
      subOperation,
      storeName,
    } = formData

    const toArray = (v: any): string[] => {
      if (!v) return []
      if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x.trim().length > 0)
      if (typeof v === "string" && v.trim().length > 0) return [v.trim()]
      return []
    }

    const reasonsMerged: string[] = [
      ...toArray(cancellationReasons),
      ...toArray(cancellationReason),
      ...toArray(reasons),
    ]

    const procedureVal: string | undefined =
      (typeof procedure === "string" && procedure) ||
      (typeof procedureType === "string" && procedureType) ||
      (typeof subOperation === "string" && subOperation) ||
      undefined

    let squareCustomerId: string | undefined = undefined

    if (
      operation === "クレジットカード情報変更" ||
      operation === "メールアドレス変更" ||
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
          console.log("Square上で顧客が見つかりました:", squareCustomerId)
        } else {
          console.log("Square上で顧客が見つかりませんでした")
          if (operation !== "登録車両変更") {
            return NextResponse.json(
              {
                success: false,
                error: "Square上に該当するメールアドレスの顧客が見つかりませんでした",
              },
              { status: 404 },
            )
          }
        }
      } catch (squareSearchError) {
        console.error("Square顧客検索エラー:", squareSearchError)
        if (operation !== "登録車両変更") {
          return NextResponse.json(
            {
              success: false,
              error: "Square顧客検索中にエラーが発生しました",
            },
            { status: 500 },
          )
        }
      }
    }

    if (squareCustomerId) {
      console.log(`Square顧客更新を開始します (操作: ${operation}, 顧客ID: ${squareCustomerId})`)

      const customersApi = squareClient.customersApi
      let companyNameCandidate: string | undefined
      let familyNameForSquare: string | undefined

      if (operation === "登録車両変更") {
        companyNameCandidate = buildCompanyName(newCarModel, newCarColor)
        familyNameForSquare = buildFamilyNameWithModel(familyName, newCarModel)
        console.log(`登録車両変更: 新車種=${newCarModel}, 新色=${newCarColor}`)
      } else {
        familyNameForSquare = buildFamilyNameWithModel(familyName, carModel)
        companyNameCandidate = buildCompanyName(carModel, carColor)
      }

      const updatePayload: any = {
        givenName,
        familyName: familyNameForSquare ?? familyName,
        emailAddress: operation === "メールアドレス変更" ? newEmail || email : email,
        phoneNumber: phone,
        note: storeName,
      }
      if (companyNameCandidate) {
        updatePayload.companyName = companyNameCandidate
      }

      try {
        console.log("Square.updateCustomer payload:", updatePayload)
        await customersApi.updateCustomer(squareCustomerId, updatePayload)
        console.log("✅ Square顧客情報が正常に更新されました")
      } catch (updateError) {
        console.error("❌ Square顧客更新エラー:", updateError)
      }
    } else if (operation === "登録車両変更") {
      console.log("⚠️ 登録車両変更: Square上で顧客が見つからなかったため、Square更新をスキップします")
    }

    let cardUpdateSummary: { last4?: string; brand?: string; newCardId?: string } | null = null
    if (operation === "クレジットカード情報変更" && squareCustomerId) {
      if (!cardToken) {
        return NextResponse.json(
          {
            success: false,
            error: "カード情報が無効です。再度カード情報を入力してください。",
          },
          { status: 400 },
        )
      }

      try {
        const idempotencyKey = generateIdempotencyKey("cardupd")
        console.log("Square: クレジットカード更新 idempotency_key:", idempotencyKey)

        const cardsApi = squareClient.cardsApi
        const { result: cardResult } = await cardsApi.createCard({
          idempotencyKey,
          sourceId: cardToken,
          card: {
            customerId: squareCustomerId,
          },
        })
        const newCard = cardResult.card
        cardUpdateSummary = {
          last4: newCard?.last4,
          brand: newCard?.cardBrand as string | undefined,
          newCardId: newCard?.id,
        }
        console.log("Square: 新カード作成完了", cardUpdateSummary)

        // 既存カードを無効化
        try {
          const { result: listRes } = await cardsApi.listCards(undefined, undefined, false, undefined, squareCustomerId)
          const existing = listRes.cards || []
          for (const c of existing) {
            if (c.id && c.id !== newCard?.id) {
              try {
                await cardsApi.disableCard(c.id)
                console.log("Square: 旧カードを無効化:", c.id)
              } catch (e) {
                console.warn("Square: 旧カードの無効化呼び出しで警告（続行）:", e)
              }
            }
          }
        } catch (disableErr) {
          console.warn("Square: 旧カードの無効化に失敗（続行）:", disableErr)
        }
      } catch (cardError) {
        console.error("Square: カード作成エラー:", cardError)
        if (cardError instanceof ApiError) {
          const errorDetails = cardError.errors?.[0]
          if (errorDetails?.code === "INVALID_CARD_DATA") {
            return NextResponse.json(
              {
                success: false,
                error: "カード情報が無効です。カード番号、有効期限、セキュリティコードを確認してください。",
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

    let googleSheetsStatus = "❌ 記録失敗"
    try {
      console.log("Google Sheetsにデータを追加中...")

      let qColumnData = ""
      if (operation === "各種手続き" && procedure) {
        qColumnData = `【${procedure}】`
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
        formatJapanDateTime(new Date()), // A: タイムスタンプ（JST表記）
        operation, // B: 操作
        "", // C: リファレンスID（CloudSQL削除により空）
        storeName, // D: 店舗
        `${familyName} ${givenName}`, // E: 名前
        email, // F: メールアドレス
        newEmail || "", // G: 新しいメールアドレス
        phone, // H: 電話番号
        carModel || "", // I: 車種
        carColor || "", // J: 車の色
        "", // K: ナンバー（削除済み）
        course || "", // L: 洗車コース名
        newCarModel || "", // M: 新しい車種
        newCarColor || "", // N: 新しい車の色
        "", // O: 新しいナンバー（削除済み）
        newCourse || "", // P: 新しいコース
        qColumnData, // Q: お問い合わせの種類と解約理由を組み合わせた形式
        "", // R: 空白
        "", // S: 会員番号
        campaignCode || "", // T: キャンペーンコード
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
      customerId: null, // CloudSQL削除により常にnull
      referenceId: "", // CloudSQL削除により空文字
      dataStorage: {
        googleSheets: googleSheetsStatus,
        email: emailStatus,
        square:
          operation === "クレジットカード情報変更"
            ? "✅ カード更新済"
            : operation === "メールアドレス変更"
              ? "✅ メールアドレス更新済"
              : operation === "登録車両変更"
                ? squareCustomerId
                  ? "✅ 車両情報更新済"
                  : "⚠️ Square顧客未発見"
                : "—",
      },
    })
  } catch (error) {
    console.error("顧客更新エラー:", error)
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: "Square APIエラー", details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
