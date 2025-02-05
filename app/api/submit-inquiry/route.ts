import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { operation, store, name, email, phone, carModel, carColor, licensePlate, inquiryDetails, referenceId } =
      formData

    // Google Sheetsにデータを追加
    await appendToSheet([
      [
        formatJapanDateTime(new Date()), // A: タイムスタンプ（日本時間）
        operation, // B: 問い合わせ内容
        referenceId, // C: リファレンスID
        store, // D: 入会店舗
        name, // E: お名前
        email, // F: メールアドレス
        "", // G: 新しいメールアドレス（空欄）
        phone, // H: 電話番号
        carModel, // I: 車種
        carColor, // J: 車の色
        licensePlate, // K: ナンバープレート
        "", // L: 入会コース（空欄）
        "", // M: 新しい車種（空欄）
        "", // N: 新しい車の色（空欄）
        "", // O: 新しいナンバープレート（空欄）
        "", // P: 新ご利用コース（空欄）
        inquiryDetails, // Q: お問い合わせ内容
      ],
    ])

    return NextResponse.json({
      success: true,
      message: "問い合わせ内容が正常に記録されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

