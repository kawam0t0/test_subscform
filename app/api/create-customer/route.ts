import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

// リファレンスID生成関数
function generateReferenceId(store: string): string {
  const storePrefix =
    {
      "SPLASH'N'GO!前橋50号店": "001",
      "SPLASH'N'GO!伊勢崎韮塚店": "002",
      "SPLASH'N'GO!高崎棟高店": "003",
      "SPLASH'N'GO!足利緑町店": "004",
      "SPLASH'N'GO!新前橋店": "005",
    }[store] || "000"

  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0")

  return `${storePrefix}${randomPart}`
}

// コース名から金額を除去する関数
function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { name, email, phone, carModel, carColor, course, store, operation, currentCourse, newCourse } = formData
    const referenceId = generateReferenceId(store)

    // まずメールアドレスで検索
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    // メールアドレスで見つからない場合は電話番号で検索
    const { result: phoneSearchResult } = !emailSearchResult.customers?.length
      ? await squareClient.customersApi.searchCustomers({
          query: {
            filter: {
              phoneNumber: {
                exact: phone,
              },
            },
          },
        })
      : { result: { customers: [] } }

    const existingCustomer = emailSearchResult.customers?.[0] || phoneSearchResult.customers?.[0]

    let customerId: string

    const customerData = {
      givenName: name,
      familyName: operation === "入会" ? `${carModel}/${carColor}` : "",
      emailAddress: email,
      phoneNumber: phone,
      referenceId: referenceId,
      note: operation === "入会" ? extractCourseName(course) : "",
      customAttributes: {
        store: { value: store },
      },
    }

    if (existingCustomer && existingCustomer.id) {
      // 既存の顧客を更新
      customerId = existingCustomer.id
      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, customerData)
      console.log("既存の顧客を更新しました:", updateResult.customer?.id)
    } else {
      // 新規顧客を作成
      const { result: customerResult } = await squareClient.customersApi.createCustomer(customerData)
      if (!customerResult.customer || !customerResult.customer.id) {
        throw new Error("顧客の作成に失敗しました")
      }
      customerId = customerResult.customer.id
      console.log("新規顧客を作成しました:", customerId)
    }

    // Google Sheetsに顧客情報を追加
    try {
      const sheetData = [
        [
          new Date().toISOString(), // タイムスタンプ
          store, // 店舗名
          name, // 名前
          email, // メールアドレス
          phone, // 電話番号
          operation === "入会" ? carModel : "", // 車種
          operation === "入会" ? carColor : "", // 車の色
          operation === "入会" ? course : "", // コース
          operation === "洗車コース変更" ? currentCourse : "", // 現在のコース
          operation === "洗車コース変更" ? newCourse : "", // 新しいコース
          customerId, // Square顧客ID
          referenceId, // リファレンスID
        ],
      ]

      await appendToSheet(sheetData)
      console.log("Google Sheetsに顧客情報が追加されました")
    } catch (sheetError) {
      console.error("Google Sheetsへの書き込み中にエラーが発生:", sheetError)
    }

    return NextResponse.json({
      success: true,
      customerId: customerId,
      referenceId: referenceId,
      message: "顧客情報が正常に登録されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

