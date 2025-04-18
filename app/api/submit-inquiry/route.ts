import { NextResponse } from "next/server"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { operation, store, familyName, givenName, email, phone, carModel, carColor, licensePlate, inquiryDetails } =
      formData

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
