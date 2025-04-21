import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import { sendInquiryConfirmationEmail } from "../../utils/email-sender"

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { operation, store, familyName, givenName, email, phone, carModel, carColor, inquiryDetails } = formData

    // Generate a new reference ID
    const referenceId = generateReferenceId(store)

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
        inquiryDetails,
      ],
    ])

    // 問い合わせ確認メールを送信
    try {
      await sendInquiryConfirmationEmail(`${familyName} ${givenName}`, email, operation, store, { inquiryDetails })
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
