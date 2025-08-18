import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { findCustomerFlexible, updateCustomer, type UpdateCustomerData } from "../../utils/cloudsql"
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

// 操作ごとに CloudSQL へ渡す更新データを構築
function buildOperationUpdateData(
  op: string,
  payload: {
    store?: string
    carModel?: string
    carColor?: string
    newCarModel?: string
    newCarColor?: string
    newCourse?: string
    newEmail?: string
    // 画面の「その他（自由記述）」等
    inquiryDetails?: string
    // 解約理由（チェックボックス配列や単体文字列が来る場合がある）
    reasonsInput?: string[] | string | null | undefined
    procedure?: string // 各種手続きのサブ種類（例: 解約 / その他問い合わせ など）
    cardSummary?: { last4?: string; brand?: string; newCardId?: string | null }
  },
): UpdateCustomerData {
  const {
    store,
    carModel,
    carColor,
    newCarModel,
    newCarColor,
    newCourse,
    newEmail,
    inquiryDetails,
    reasonsInput,
    procedure,
    cardSummary,
  } = payload

  const base: UpdateCustomerData = {
    inquiryType: op,
    inquiryDetails: inquiryDetails || "",
    storeName: store,
  }

  const normalizeReasons = (input: string[] | string | null | undefined): string[] => {
    if (!input) return []
    if (Array.isArray(input)) return input.filter((s) => typeof s === "string" && s.trim().length > 0)
    if (typeof input === "string" && input.trim().length > 0) return [input.trim()]
    return []
  }

  switch (op) {
    case "登録車両変更":
      return {
        ...base,
        newCarModel: newCarModel || undefined,
        newCarColor: newCarColor || undefined,
        status: "completed",
        // 変更情報は cancellation_reasons に保存しない
      }

    case "洗車コース変更":
      return {
        ...base,
        newCourseName: newCourse || undefined,
        status: "completed",
      }

    case "メールアドレス変更":
      return {
        ...base,
        newEmail: newEmail || undefined,
        status: "completed",
      }

    case "クレジットカード情報変更": {
      // 機微情報は保存しない。要約のみ inquiry_details に記録
      const detail = `クレジットカード情報変更: brand=${cardSummary?.brand ?? "不明"}, last4=****${cardSummary?.last4 ?? "????"}`
      return {
        ...base,
        inquiryDetails: base.inquiryDetails ? `${base.inquiryDetails}\n${detail}` : detail,
        status: "completed",
        cancellationReasons: null, // ← 理由カラムには書かない
      }
    }

    case "各種手続き": {
      // サブ種類が「解約」または「その他問い合わせ」の場合、それを inquiry_details に記録
      const isCancel = procedure === "解約" || procedure === "退会" || procedure === "キャンセル"
      const isOtherInquiry = procedure === "その他問い合わせ"

      const details = isCancel ? "解約" : isOtherInquiry ? "その他問い合わせ" : base.inquiryDetails || "各種手続き"

      // 理由は reasonsInput（配列/単体文字）を優先し、さらに自由記述も理由として格納する（複数OK）
      const reasons = normalizeReasons(reasonsInput)

      // 自由記述を cancellation_reasons にも格納（空なら無視）
      const extraFreeText = (base.inquiryDetails || "").trim()
      if (extraFreeText) reasons.push(extraFreeText)

      return {
        ...base,
        inquiryDetails: details,
        status: "received",
        cancellationReasons: reasons.length > 0 ? reasons : null,
        customerStatus: isCancel ? "pending" : undefined, // 解約扱いなら pending へ
      }
    }

    case "解約": {
      // トップレベルで「解約」を選択
      const reasons = normalizeReasons(reasonsInput)
      const freeText = (base.inquiryDetails || "").trim()
      if (freeText) reasons.push(freeText)

      return {
        ...base,
        inquiryDetails: "解約",
        status: "received",
        cancellationReasons: reasons.length > 0 ? reasons : null,
        customerStatus: "pending",
      }
    }

    case "その他問い合わせ": {
      // トップレベルで「その他問い合わせ」を選択
      const reasons = normalizeReasons(reasonsInput)
      const freeText = (base.inquiryDetails || "").trim()
      if (freeText) reasons.push(freeText)

      return {
        ...base,
        inquiryDetails: "その他問い合わせ",
        status: "received",
        cancellationReasons: reasons.length > 0 ? reasons : null,
      }
    }

    default:
      return { ...base, status: "received", cancellationReasons: null }
  }
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
      inquiryDetails, // 自由記述
      campaignCode,
      cardToken, // カード更新時に使用

      // 解約理由（チェックボックス/単体文字）・その他自由記述
      cancellationReasons, // 例: ["他店舗を使うようになった", ...] または "解約したい"
      cancellationReason, // 単体キーで来るケース
      reasons, // 別名で来るケース

      // 各種手続きのサブ種類
      procedure,
      procedureType,
      subOperation,
    } = formData

    // 1) CloudSQLで顧客検索（柔軟に）
    console.log("CloudSQLで顧客を検索中...")
    const customer = await findCustomerFlexible(email, phone, carModel)
    if (!customer) {
      return NextResponse.json({ success: false, error: "該当する顧客が見つかりませんでした" }, { status: 404 })
    }

    const cloudSqlCustomerId = customer.id
    const squareCustomerId: string | undefined = (customer.square_customer_id as string | undefined) || undefined
    console.log("CloudSQLで顧客が見つかりました:", cloudSqlCustomerId, "SquareID:", squareCustomerId || "(なし)")

    // 2) Square 顧客の会社名（車種/色）と姓（車種/姓）を必要に応じて更新
    if (squareCustomerId) {
      try {
        const customersApi = squareClient.customersApi
        let companyNameCandidate: string | undefined
        let familyNameForSquare: string | undefined

        if (operation === "登録車両変更") {
          companyNameCandidate = buildCompanyName(newCarModel, newCarColor)
          familyNameForSquare = buildFamilyNameWithModel(familyName, newCarModel)
        } else {
          // 入会は別ルートで対応済み。ほかの操作で車種が送られてくる場合に姓を更新したいなら次の行を有効化
          // familyNameForSquare = buildFamilyNameWithModel(familyName, carModel)
          companyNameCandidate = buildCompanyName(carModel, carColor)
        }

        const updatePayload: any = {
          givenName,
          // familyName は「登録車両変更」のときのみ「車種/姓」に上書きし、それ以外は送られてきた姓を維持
          familyName: familyNameForSquare ?? familyName,
          emailAddress: operation === "メールアドレス変更" ? newEmail || email : email,
          phoneNumber: phone,
          note: store,
        }
        if (companyNameCandidate) {
          updatePayload.companyName = companyNameCandidate // 会社名は「車種/色」
        }

        console.log("Square.updateCustomer payload:", updatePayload)
        await customersApi.updateCustomer(squareCustomerId, updatePayload)
      } catch (err) {
        console.error("Square 顧客更新エラー（会社名/姓の更新）:", err)
        // 続行
      }
    }

    // 3) クレジットカード情報変更時は Square Cards API でカードを作成（更新）
    let cardUpdateSummary: { last4?: string; brand?: string; newCardId?: string } | null = null
    if (operation === "クレジットカード情報変更") {
      if (!squareCustomerId) {
        return NextResponse.json(
          { success: false, error: "Square顧客IDが見つかりません（カード更新不可）" },
          { status: 400 },
        )
      }
      if (!cardToken || typeof cardToken !== "string" || cardToken.trim().length === 0) {
        return NextResponse.json({ success: false, error: "カードトークンが不正です" }, { status: 400 })
      }
      try {
        const idempotencyKey = generateIdempotencyKey("cardupd")
        console.log("Square: クレジットカード更新 idempotency_key:", idempotencyKey, "len:", idempotencyKey.length)

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

        // 既存カードがあれば無効化（新カード以外）
        try {
          const { result: listRes } = await cardsApi.listCards(
            undefined, // cursor
            undefined, // limit
            false, // includeDisabled
            undefined, // referenceId
            squareCustomerId, // customerId (5th param)
          )
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
      } catch (err) {
        console.error("Square カード更新エラー:", err)
        return NextResponse.json({ success: false, error: "クレジットカード情報の更新に失敗しました" }, { status: 400 })
      }
    }

    // 4) CloudSQL顧客情報を更新（問い合わせ記録含む）
    // 理由入力を一旦正規化（配列/単体文字どちらでも配列化）
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

    // 操作ごとの UpdateCustomerData を構築
    const updateData: UpdateCustomerData = buildOperationUpdateData(operation, {
      store,
      carModel,
      carColor,
      newCarModel,
      newCarColor,
      newCourse,
      newEmail,
      inquiryDetails, // 自由記述
      reasonsInput: reasonsMerged,
      procedure: procedureVal,
      cardSummary: cardUpdateSummary || undefined,
    })

    console.log("CloudSQL顧客情報を更新中...")
    await updateCustomer(cloudSqlCustomerId, updateData)
    console.log("CloudSQL顧客情報が正常に更新されました:", cloudSqlCustomerId)

    // 5) Google Sheets（既存の形式を踏襲）
    let googleSheetsStatus = "❌ 記録失敗"
    try {
      console.log("Google Sheetsにデータを追加中...")

      let qColumnData = ""
      if (operation === "各種手続き" && procedureVal) {
        // 【解約】解約理由: ... の形式
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
        // その他の操作の場合は従来通り
        qColumnData = inquiryDetails || ""
      }

      const sheetData = [
        formatJapanDateTime(new Date()), // A: タイムスタンプ（JST表記）
        operation, // B: 操作
        customer.reference_id, // C: リファレンスID
        store, // D: 店舗
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

    // 6) 確認メール
    let emailStatus = "❌ 送信失敗"
    try {
      await sendInquiryConfirmationEmail(`${familyName} ${givenName}`, email, operation, store, customer.reference_id)
      emailStatus = "✅ 送信完了"
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      emailStatus = `❌ 送信失敗: ${emailError instanceof Error ? emailError.message : "不明なエラー"}`
    }

    return NextResponse.json({
      success: true,
      message: "処理が完了しました",
      customerId: cloudSqlCustomerId,
      referenceId: customer.reference_id,
      dataStorage: {
        cloudSQL: "✅ 更新完了",
        googleSheets: googleSheetsStatus,
        email: emailStatus,
        square: operation === "クレジットカード情報変更" ? "✅ カード更新済" : "—",
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
