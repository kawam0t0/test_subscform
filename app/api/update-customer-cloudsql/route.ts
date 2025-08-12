import { NextResponse } from "next/server"
import { findCustomer, updateCustomer, type UpdateCustomerData } from "../../utils/cloudsql"
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
      newCarModel,
      newCarColor,
      newCourse,
      newEmail,
      inquiryDetails,
      campaignCode,
    } = formData

    // 1. CloudSQLで顧客を検索
    console.log("CloudSQLで顧客を検索中...")
    const customer = await findCustomer(email, phone, carModel)

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "該当する顧客が見つかりませんでした" },
        { status: 404 }
      )
    }

    const cloudSqlCustomerId = customer.id
    console.log("CloudSQLで顧客が見つかりました:", cloudSqlCustomerId)

    // 2. CloudSQL顧客情報を更新
    console.log("CloudSQL顧客情報を更新中...")
    const updateData: UpdateCustomerData = {
      inquiryType: operation,
      inquiryDetails: inquiryDetails || "",
      storeName: store, // storeIdではなくstoreNameを使用
      newCarModel: newCarModel || undefined,
      newCarColor: newCarColor || undefined,
      newCourseName: newCourse || undefined,
      newEmail: newEmail || undefined,
    }

    await updateCustomer(cloudSqlCustomerId, updateData)
    console.log("CloudSQL顧客情報が正常に更新されました:", cloudSqlCustomerId)

    // 3. Google Sheetsにデータを追加
    let googleSheetsStatus = "❌ 記録失敗"
    try {
      console.log("Google Sheetsにデータを追加中...")
      const sheetData = [
        formatJapanDateTime(new Date()), // A列: タイムスタンプ
        operation, // B列: 操作
        customer.reference_id, // C列: リファレンスID
        store, // D列: 店舗
        `${familyName} ${givenName}`, // E列: 名前
        email, // F列: メールアドレス
        newEmail || "", // G列: 新しいメールアドレス
        phone, // H列: 電話番号
        carModel, // I列: 車種
        carColor, // J列: 車の色
        "", // K列: ナンバー（削除済み）
        course || "", // L列: 洗車コース名
        newCarModel || "", // M列: 新しい車種
        newCarColor || "", // N列: 新しい車の色
        "", // O列: 新しいナンバープレート（削除済み）
        newCourse || "", // P列: 新しいコース
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

    // 4. 確認メールを送信
    let emailStatus = "❌ 送信失敗"
    try {
      await sendInquiryConfirmationEmail(
        `${familyName} ${givenName}`,
        email,
        operation,
        store,
        customer.reference_id
      )
      emailStatus = "✅ 送信完了"
      console.log("問い合わせ確認メールを送信しました")
    } catch (emailError) {
      console.error("メール送信中にエラーが発生しました:", emailError)
      emailStatus = `❌ 送信失敗: ${emailError instanceof Error ? emailError.message : '不明なエラー'}`
    }

    return NextResponse.json({
      success: true,
      message: "顧客情報更新処理が完了しました",
      customerId: cloudSqlCustomerId,
      referenceId: customer.reference_id,
      dataStorage: {
        cloudSQL: "✅ 更新完了",
        googleSheets: googleSheetsStatus,
        email: emailStatus,
      },
    })
  } catch (error) {
    console.error("顧客更新エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 }
    )
  }
}
