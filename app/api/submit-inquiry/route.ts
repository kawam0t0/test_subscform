import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { operation, store, name, email, phone, carModel, carColor, licensePlate, inquiryDetails } = formData

    // Google Sheetsにデータを追加
    // A~O列のデータを配列として準備
    await appendToSheet([
      [
        new Date().toISOString(), // A: タイムスタンプ
        operation, // B: 問い合わせ内容
        store, // C: 入会店舗
        name, // D: お名前
        email, // E: メールアドレス
        phone, // F: 電話番号
        carModel, // G: 車種
        carColor, // H: 車の色
        licensePlate, // I: ナンバープレート
        "", // J: 入会コース（その他の場合は空欄）
        "", // K: 新しい車種（その他の場合は空欄）
        "", // L: 新しい車の色（その他の場合は空欄）
        "", // M: 新しいナンバープレート（その他の場合は空欄）
        "", // N: 新ご利用コース（その他の場合は空欄）
        inquiryDetails, // O: お問い合わせ内容
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

