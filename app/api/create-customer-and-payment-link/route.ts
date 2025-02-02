import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

// 環境変数の存在確認を行う関数
function assertEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`環境変数 ${name} が設定されていません`)
    throw new Error(`環境変数 ${name} が設定されていません`)
  }
  return value
}

export async function POST(request: Request) {
  try {
    // リクエストボディをログに記録
    const formData = await request.json()
    console.log("受信したフォームデータ:", JSON.stringify(formData, null, 2))

    const { name, email, phone, carModel, carColor, course, store } = formData

    // 必須フィールドの検証
    if (!name || !email || !phone || !carModel || !carColor || !course || !store) {
      console.error("必須フィールドが不足しています:", { name, email, phone, carModel, carColor, course, store })
      return NextResponse.json({ success: false, error: "必須フィールドが不足しています" }, { status: 400 })
    }

    // Square API を使用して顧客を作成
    console.log("Square API で顧客を作成中...")
    const { result: customerResult } = await squareClient.customersApi.createCustomer({
      givenName: name,
      emailAddress: email,
      phoneNumber: phone,
      note: `車種: ${carModel}, 色: ${carColor}, コース: ${course}, 店舗: ${store}`,
    })

    if (!customerResult.customer || !customerResult.customer.id) {
      console.error("顧客の作成に失敗しました:", customerResult)
      throw new Error("顧客の作成に失敗しました")
    }

    const customerId = customerResult.customer.id
    console.log("顧客が作成されました:", customerId)

    // コースの価格を取得
    const coursePrice = getCoursePrice(course)
    if (coursePrice === 0) {
      console.error("無効なコース価格:", course)
      throw new Error("無効なコース価格です")
    }

    // 環境変数の存在を確認
    const locationId = assertEnvVar("SQUARE_LOCATION_ID")
    const baseUrl = assertEnvVar("NEXT_PUBLIC_BASE_URL")

    console.log("支払いリンクを生成中...", {
      customerId,
      coursePrice,
      locationId,
      baseUrl,
    })

    // Square Payment Link API を使用して支払いリンクを生成
    const { result: paymentLinkResult } = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: `${customerId}-${Date.now()}`,
      quickPay: {
        name: course,
        priceMoney: {
          amount: BigInt(coursePrice * 100),
          currency: "JPY",
        },
        locationId: locationId,
      },
      checkoutOptions: {
        redirectUrl: `${baseUrl}/thank-you`,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: email,
        buyerPhoneNumber: phone,
      },
      paymentNote: `顧客ID: ${customerId}`,
    })

    if (!paymentLinkResult.paymentLink || !paymentLinkResult.paymentLink.url) {
      console.error("支払いリンクの生成に失敗しました:", paymentLinkResult)
      throw new Error("支払いリンクの生成に失敗しました")
    }

    console.log("支払いリンクが生成されました:", paymentLinkResult.paymentLink.url)

    return NextResponse.json({
      success: true,
      paymentLink: paymentLinkResult.paymentLink.url,
    })
  } catch (error) {
    // Square APIのエラーをより詳細に処理
    if (error instanceof ApiError) {
      console.error("Square API エラー:", {
        statusCode: error.statusCode,
        errors: error.errors,
        message: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Square API エラー: ${error.message}`,
          details: error.errors,
        },
        { status: error.statusCode || 500 },
      )
    }

    console.error("API エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      },
      { status: 500 },
    )
  }
}

function getCoursePrice(course: string): number {
  const prices: { [key: string]: number } = {
    "プレミアムスタンダード（月額980円）": 980,
    "コーティングプラス（月額1280円）": 1280,
    "スーパーシャンプーナイアガラ（月額1480円）": 1480,
    "セラミックコーティングタートルシェル（月額2980円）": 2980,
  }
  return prices[course] || 0
}

