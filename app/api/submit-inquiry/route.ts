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
<<<<<<< HEAD
      membershipNumber, // 会員番号を追加
=======
>>>>>>> 4fc69638a5f800f21c18f4934f90fb4dfc7f16a7
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
<<<<<<< HEAD
        formatJapanDateTime(new Date()), // A列
        operation, // B列
        referenceId, // C列
        store, // D列
        `${familyName} ${givenName}`, // E列
        email, // F列
        "", // G列: 新しいメールアドレス
        phone, // H列
        carModel, // I列
        carColor, // J列
        "", // K列: ナンバー（削除済み）
        "", // L列
        "", // M列
        "", // N列
        "", // O列: 新しいナンバープレート（削除済み）
        "", // P列
        combinedInquiry, // Q列：プルダウンの内容、解約理由、お問い合わせ内容を結合
        "", // R列: 空白
        membershipNumber || "", // S列: 会員番号
=======
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
>>>>>>> 4fc69638a5f800f21c18f4934f90fb4dfc7f16a7
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
