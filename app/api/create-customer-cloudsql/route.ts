import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { insertCustomer, type InsertCustomerData } from "../../utils/cloudsql"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import { sendConfirmationEmail } from "../../utils/email-sender"
//テスト・テストテスト
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

export async function POST(request: Request) {
  let customerId: string | null = null

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
      licensePlate,
      cardToken,
      referenceId,
      course,
      newCarModel,
      newCarColor,
      newLicensePlate,
      currentCourse,
      newCourse,
      inquiryDetails,
      newEmail,
      isLimitedProductStore,
      enableSubscription,
      campaignCode,
    } = formData

    // 1. Square顧客を作成
    console.log("Square顧客を作成中...")
    const customersApi = squareClient.customersApi

    const createCustomerRequest = {
      givenName: givenName,
      familyName: familyName,
      emailAddress: email,
      phoneNumber: phone,
      referenceId: referenceId || generateReferenceId(store),
    }

    const { result: customerResult } = await customersApi.createCustomer(createCustomerRequest)
    customerId = customerResult.customer?.id || null

    if (!customerId) {
      throw new Error("Square顧客の作成に失敗しました")
    }

    console.log("Square顧客が正常に作成されました:", customerId)

    // 2. クレジットカード情報を保存
    console.log("クレジットカード情報を保存中...")
    const cardsApi = squareClient.cardsApi

    const { result: cardResult } = await cardsApi.createCard({
      idempotencyKey: `card-${customerId}-${Date.now()}`,
      sourceId: cardToken,
      card: {
        customerId: customerId,
      },
    })

    console.log("クレジットカード情報が正常に保存されました")

    // 3. CloudSQLに顧客データを挿入（store_name使用、store_codeは自動取得）
    console.log("CloudSQLに顧客データを挿入中...")
    
    const customerData: InsertCustomerData = {
      referenceId: createCustomerRequest.referenceId,
      squareCustomerId: customerId,
      familyName: familyName,
      givenName: givenName,
      email: email,
      phone: phone,
      course: extractCourseName(course),
      carModel: carModel,
      color: carColor,
      plateInfo1: licensePlate || null,
      plateInfo2: null,
      plateInfo3: null,
      plateInfo4: null,
      storeName: store,  // store_nameを使用してstore_codeを自動取得
      campaignCode: campaignCode || null
    }

    const cloudSqlCustomerId = await insertCustomer(customerData)
    console.log("CloudSQLに顧客データが正常に挿入されました:", cloudSqlCustomerId)

    // 4. Google Sheetsにデータを追加
    console.log("Google Sheetsにデータを追加中...")
    const sheetData = [
      formatJapanDateTime(new Date()),
      operation,
      createCustomerRequest.referenceId,
      store,
      `${familyName} ${givenName}`,
      email,
      "",
      phone,
      carModel,
      carColor,
      licensePlate || "",
      extractCourseName(course),
      newCarModel || "",
      newCarColor || "",
      newLicensePlate || "",
      currentCourse || "",
      newCourse || "",
      inquiryDetails || "",
      newEmail || "",
      campaignCode || "",
    ]

    // 配列の配列として渡す
    await appendToSheet([sheetData])
    console.log("Google Sheetsにデータが正常に追加されました")

    // 5. 確認メールを送信
    try {
      await sendConfirmationEmail(`${familyName} ${givenName}`, email, course, store, createCustomerRequest.referenceId)
      console.log("確認メールが送信されました")
    } catch (emailError) {
      console.error("確認メール送信エラー:", emailError)
      // メール送信エラーは処理を停止させない
    }

    console.log("確認メールを送信しました")

    return NextResponse.json({
      success: true,
      customerId: customerId,
      cloudSqlCustomerId: cloudSqlCustomerId,
      referenceId: createCustomerRequest.referenceId,
    })
  } catch (error) {
    console.error("エラーが発生しました:", error)

    // Square顧客が作成された場合は削除を試行
    if (customerId) {
      try {
        const customersApi = squareClient.customersApi
        await customersApi.deleteCustomer(customerId)
        console.log("作成されたSquare顧客を削除しました:", customerId)
      } catch (deleteError) {
        console.error("Square顧客の削除に失敗しました:", deleteError)
      }
    }

    if (error instanceof ApiError) {
      console.error("Square APIエラー:", error.errors)
      return NextResponse.json({ error: "Square APIエラーが発生しました", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "内部サーバーエラーが発生しました" }, { status: 500 })
  }
}
