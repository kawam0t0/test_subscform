import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
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
      course,
      inquiryDetails,
      campaignCode,
    } = formData

    // 1. Google Sheetsにデータを追加
    let googleSheetsStatus = "❌ 記録失敗"
    try {
      console.log("Google Sheetsにデータを追加中...")
      const sheetData = [
        formatJapanDateTime(new Date()), // A列: タイムスタンプ
        operation, // B列: 操作
        "", // C列: リファレンスID（問い合わせの場合は空）
        store, // D列: 店舗
        `${familyName} ${givenName}`, // E列: 名前
        email, // F列: メールアドレス
        "", // G列: 新しいメールアドレス
        phone, // H列: 電話番号
        carModel, // I列: 車種
        carColor, // J列: 車の色
        "", // K列: ナンバー（削除済み）
        course || "", // L列: 洗車コース名
        "", // M列: 新しい車種
        "", // N列: 新しい車の色
        "", // O列: 新しいナンバープレート（削除済み）
        "", // P列: 新しいコース
        inquiryDetails || "", // Q列: その他
        "", // R列: 空白
        "", // S列: 会員番号
        campaignCode || "", // T列: キャンペーンコード
      ]

      await appendToSheet([sheetData])
      googleSheetsStatus = "✅ 記録完了"
      console.log("Google Sheetsにデータが正常に追加されました")
    } catch (sheetError) {
      console.error("Google Sheets書き込みエラー:", sheetError)
      googleSheetsStatus = `❌ 記録失敗: ${sheetError instanceof Error ? sheetError.message : '不明なエラー'}`
    }

    // 2. 確認メールを送信
    let emailStatus = "❌ 送信失敗"
    try {
      await sendInquiryConfirmationEmail(
        `${familyName} ${givenName}`,
        email,
        operation,
        store,
        ""
      )
      emailStatus = "✅ 送信完了"
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      emailStatus = `❌ 送信失敗: ${emailError instanceof Error ? emailError.message : '不明なエラー'}`
    }

    return NextResponse.json({
      success: true,
      message: "問い合わせが正常に送信されました",
      dataStorage: {
        googleSheets: googleSheetsStatus,
        email: emailStatus,
      },
    })
  } catch (error) {
    console.error("問い合わせ送信エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 }
    )
  }
}
