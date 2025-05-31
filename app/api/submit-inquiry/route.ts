import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import { sendInquiryConfirmationEmail } from "../../utils/email-sender"

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
      inquiryDetails,
      inquiryType,
      cancellationReasons,
    } = formData

    // Generate a new reference ID
    const referenceId = generateReferenceId(store)

    // プルダウンの選択内容、解約理由、お問い合わせ内容を結合
    let combinedInquiry = ""

    if (inquiryType) {
      combinedInquiry = `【${inquiryType}】`

      // 解約理由がある場合は追加
      if (cancellationReasons && cancellationReasons.length > 0) {
        combinedInquiry += `\n解約理由: ${cancellationReasons.join(", ")}`
      }

      // 詳細内容がある場合は追加
      if (inquiryDetails) {
        combinedInquiry += `\n${inquiryDetails}`
      }
    } else {
      combinedInquiry = inquiryDetails || ""
    }

    // Google Sheetsにデータを追加
    await appendToSheet([
      [
        formatJapanDateTime(new Date()),
        operation,
        referenceId,
        store,
        `${familyName} ${givenName}`,
        email,
        "",
        phone,
        carModel,
        carColor,
        "", // ナンバープレート（削除済み）
        "",
        "",
        "",
        "", // 新しいナンバープレート（削除済み）
        "",
        combinedInquiry, // Q列：プルダウンの内容、解約理由、お問い合わせ内容を結合
      ],
    ])

    // 問い合わせ確認メールを送信
    try {
      await sendInquiryConfirmationEmail(`${familyName} ${givenName}`, email, operation, store, {
        inquiryDetails: combinedInquiry,
        inquiryType,
        cancellationReasons,
      })
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      // メール送信エラーは処理を中断しない
    }

    return NextResponse.json({
      success: true,
      message: "問い合わせ内容が正常に記録されました",
      referenceId: referenceId,
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
