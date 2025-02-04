import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { operation, store, name, email, phone, carModel, carColor, licensePlate, inquiryDetails } = formData

    // Google Sheetsにデータを追加
    // A~P列のデータを配列として準備
    await appendToSheet([
      [
        formatJapanDateTime(new Date()), // A: タイムスタンプ（日本時間）
        operation, // B: 問い合わせ内容
        "", // C: リファレンスID（その他の問い合わせの場合は空欄）
        store, // D: 入会店舗
        name, // E: お名前
        email, // F: メールアドレス
        phone, // G: 電話番号
        carModel, // H: 車種
        carColor, // I: 車の色
        licensePlate, // J: ナンバープレート
        "", // K: 入会コース（その他の場合は空欄）
        "", // L: 新しい車種（その他の場合は空欄）
        "", // M: 新しい車の色（その他の場合は空欄）
        "", // N: 新しいナンバープレート（その他の場合は空欄）
        "", // O: 新ご利用コース（その他の場合は空欄）
        inquiryDetails, // P: お問い合わせ内容
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

