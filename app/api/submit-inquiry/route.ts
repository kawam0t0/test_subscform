import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { operation, store, name, email, phone, carModel, carColor, inquiryDetails } = formData

    // Google Sheetsに問い合わせ内容を追加
    await appendToSheet([
      [new Date().toISOString(), operation, store, name, email, phone, carModel, carColor, inquiryDetails],
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

