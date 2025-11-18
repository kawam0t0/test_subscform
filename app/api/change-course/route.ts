import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractCourseName(course: string): string {
  return course?.split("（")[0].trim() || ""
}

const COURSE_PRICING = {
  プレミアムスタンダード: 980,
  コーティングプラス: 1280,
  スーパーシャンプーナイアガラ: 1480,
  セラミックコーティングタートルシェル: 2980,
}

function getLocationIdFromStoreName(storeName: string): string {
  const locationMap: { [key: string]: string } = {
    "SPLASH'N'GO!前橋50号店": "LG6JAY9JNP1VC",
    "SPLASH'N'GO!伊勢崎韮塚店": "LT0AQBXQVVHXE",
    "SPLASH'N'GO!高崎棟高店": "LQBXVVHXE",
    "SPLASH'N'GO!足利緑町店": "LQBXVVHXF",
    "SPLASH'N'GO!新前橋店": "LQBXVVHXG",
    "SPLASH'N'GO!太田新田店": "LQBXVVHXH",
    "テスト店舗": "LG6JAY9JNP1VC",
  }
  return locationMap[storeName] || "LG6JAY9JNP1VC"
}

async function getOrCreatePlan(courseName: string, price: number): Promise<string> {
  try {
    console.log("[v0] 🔍 プランを検索中:", courseName, price, "円")

    const expectedPlanName = `${courseName}（固定額）`

    // Search for existing plan
    const searchResult = await squareClient.catalogApi.searchCatalogObjects({
      objectTypes: ["SUBSCRIPTION_PLAN"],
      limit: 100,
    })

    if (searchResult.result.objects && searchResult.result.objects.length > 0) {
      for (const obj of searchResult.result.objects) {
        if (obj.isDeleted || !obj.presentAtAllLocations) {
          continue
        }

        const planName = obj.subscriptionPlanData?.name

        if (planName === expectedPlanName) {
          const variations = obj.subscriptionPlanData?.subscriptionPlanVariations || []
          for (const variation of variations) {
            const phases = variation.subscriptionPlanVariationData?.phases || []

            if (phases.length > 0) {
              const phasePrice = Number(phases[0].pricing?.priceMoney?.amount || 0)

              if (phases[0].pricing?.type === "STATIC" && phasePrice === price) {
                console.log("[v0] ✅ 既存のプランを発見:", variation.id)
                return variation.id!
              }
            }
          }
        }
      }
    }

    // Create new plan if not found
    console.log("[v0] 新しいプランを作成中...")
    const planId = `#plan-${courseName.replace(/\s+/g, "-")}-${Date.now()}`
    const variationId = `#var-${courseName.replace(/\s+/g, "-")}-${Date.now()}`

    const { result } = await squareClient.catalogApi.upsertCatalogObject({
      idempotencyKey: `plan-${courseName}-${Date.now()}`,
      object: {
        id: planId,
        type: "SUBSCRIPTION_PLAN",
        subscriptionPlanData: {
          name: expectedPlanName,
          subscriptionPlanVariations: [
            {
              type: "SUBSCRIPTION_PLAN_VARIATION",
              id: variationId,
              subscriptionPlanVariationData: {
                name: courseName,
                phases: [
                  {
                    cadence: "MONTHLY",
                    ordinal: 0 as any,
                    pricing: {
                      type: "STATIC",
                      priceMoney: {
                        amount: BigInt(price),
                        currency: "JPY",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    })

    const createdVariationId = result.catalogObject?.subscriptionPlanData?.subscriptionPlanVariations?.[0]?.id

    if (!createdVariationId) {
      throw new Error("プランバリエーションIDの取得に失敗しました")
    }

    console.log("[v0] ✅ 新しいプランを作成しました:", createdVariationId)
    return createdVariationId
  } catch (err) {
    console.error("[v0] ❌ プラン取得/作成エラー:", err)
    throw err
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("========================================")
    console.log("[v0] コース変更リクエスト受信:", formData)
    console.log("========================================")

    const { referenceId, newCourse, store } = formData

    if (!referenceId || !newCourse) {
      return NextResponse.json(
        { success: false, error: "リファレンスIDと新しいコースを指定してください" },
        { status: 400 },
      )
    }

    console.log("[v0] 顧客を検索中... リファレンスID:", referenceId)
    const { result: searchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          referenceId: {
            exact: referenceId,
          },
        },
      },
    })

    if (!searchResult.customers || searchResult.customers.length === 0) {
      console.log("[v0] ❌ 顧客が見つかりません")
      return NextResponse.json(
        { success: false, error: "リファレンスIDに不備があります。入会時にお送りしたメールをご確認ください。" },
        { status: 404 },
      )
    }

    const customer = searchResult.customers[0]
    const customerId = customer.id!
    console.log("[v0] ✅ 顧客を発見:", customerId, customer.givenName, customer.familyName)

    console.log("[v0] サブスクリプションを検索中...")
    const { result: subscriptionSearchResult } = await squareClient.subscriptionsApi.searchSubscriptions({
      query: {
        filter: {
          customerIds: [customerId],
          locationIds: [getLocationIdFromStoreName(store)],
        },
      },
    })

    if (!subscriptionSearchResult.subscriptions || subscriptionSearchResult.subscriptions.length === 0) {
      console.log("[v0] ❌ 有効なサブスクリプションが見つかりません")
      return NextResponse.json(
        { success: false, error: "有効なサブスクリプションが見つかりません。店舗にお問い合わせください。" },
        { status: 404 },
      )
    }

    // Find active subscription
    const activeSubscription = subscriptionSearchResult.subscriptions.find(
      (sub) => sub.status === "ACTIVE" || sub.status === "PENDING",
    )

    if (!activeSubscription) {
      console.log("[v0] ❌ 有効なサブスクリプションが見つかりません")
      return NextResponse.json(
        { success: false, error: "有効なサブスクリプションが見つかりません。店舗にお問い合わせください。" },
        { status: 404 },
      )
    }

    const subscriptionId = activeSubscription.id!
    console.log("[v0] ✅ 有効なサブスクリプションを発見:", subscriptionId)

    const cleanCourseName = extractCourseName(newCourse)
    const newPrice = COURSE_PRICING[cleanCourseName as keyof typeof COURSE_PRICING]

    if (!newPrice) {
      return NextResponse.json({ success: false, error: "選択されたコースの価格が見つかりません" }, { status: 400 })
    }

    const newPlanVariationId = await getOrCreatePlan(cleanCourseName, newPrice)

    console.log("[v0] サブスクリプションを更新中...")
    console.log("[v0] 新しいプランバリエーションID:", newPlanVariationId)

    const { result: updateResult } = await squareClient.subscriptionsApi.swapPlan(subscriptionId, {
      newPlanVariationId: newPlanVariationId,
    })

    console.log("[v0] ✅ サブスクリプションが正常に更新されました!")
    console.log("[v0] 新しいコース:", cleanCourseName)
    console.log("[v0] 新しい月額料金:", newPrice, "円")
    console.log("[v0] 次回請求日から新料金が適用されます")

    const updatedNote = `店舗: ${store}\n洗車コース: ${cleanCourseName}`
    await squareClient.customersApi.updateCustomer(customerId, {
      note: updatedNote,
    })
    console.log("[v0] ✅ 顧客メモを更新しました")

    console.log("========================================")

    return NextResponse.json({
      success: true,
      message: `コース変更が完了しました。次回請求日から「${cleanCourseName}」（月額${newPrice}円）が適用されます。`,
      subscriptionId: subscriptionId,
      newCourse: cleanCourseName,
      newPrice: newPrice,
    })
  } catch (error) {
    console.error("========================================")
    console.error("[v0] ❌ コース変更エラー:", error)
    console.error("========================================")

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: "Square APIエラーが発生しました",
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "内部サーバーエラーが発生しました",
        message: error instanceof Error ? error.message : "お手数ですが、しばらく時間をおいて再度お試しください",
      },
      { status: 500 },
    )
  }
}
