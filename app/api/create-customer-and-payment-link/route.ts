import { NextResponse } from "next/server"
import { Client, Environment } from "square"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

// 新しく追加: 環境変数の存在確認を行う関数
function assertEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`)
  }
  return value
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const { name, email, phone, carModel, carColor, course, store } = formData

    // Square API を使用して顧客を作成
    const { result: customerResult } = await squareClient.customersApi.createCustomer({
      givenName: name,
      emailAddress: email,
      phoneNumber: phone,
      note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}, 店舗: ${store}`,
    })

    if (!customerResult.customer || !customerResult.customer.id) {
      throw new Error("顧客の作成に失敗しました")
    }

    const customerId = customerResult.customer.id

    // コースの価格を取得（実際の実装ではこの部分を適切に処理してください）
    const coursePrice = getCoursePrice(course)

    // 変更: 環境変数の存在を確認
    const locationId = assertEnvVar("SQUARE_LOCATION_ID")
    const baseUrl = assertEnvVar("NEXT_PUBLIC_BASE_URL")

    // Square Payment Link API を使用して支払いリンクを生成
    const { result: paymentLinkResult } = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: `${customerId}-${Date.now()}`,
      quickPay: {
        name: course,
        priceMoney: {
          amount: BigInt(coursePrice * 100), // セント単位で指定
          currency: "JPY",
        },
        locationId: locationId, // 変更: 直接環境変数を使用せず、確認済みの値を使用
      },
      checkoutOptions: {
        customerCancel: false,
        redirectUrl: `${baseUrl}/thank-you`, // 変更: 確認済みのbaseUrlを使用
      },
      prePopulatedData: {
        buyerEmail: email,
        buyerPhoneNumber: phone,
      },
      paymentNote: `顧客ID: ${customerId}`,
    })

    if (!paymentLinkResult.paymentLink || !paymentLinkResult.paymentLink.url) {
      throw new Error("支払いリンクの生成に失敗しました")
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLinkResult.paymentLink.url,
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

// コースの価格を取得する関数（実際の実装に合わせて調整してください）
function getCoursePrice(course: string): number {
  const prices: { [key: string]: number } = {
    "プレミアムスタンダード（月額980円）": 980,
    "コーティングプラス（月額1280円）": 1280,
    "スーパーシャンプーナイアガラ（月額1480円）": 1480,
    "セラミックコーティングタートルシェル（月額2980円）": 2980,
  }
  return prices[course] || 0
}

