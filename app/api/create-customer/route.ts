import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import { sendConfirmationEmail } from "../../utils/email-sender"
import { getLocationIdFromStoreName } from "../../utils/subscription-plans"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractCourseName(course: string): string {
  return course?.split("（")[0].trim() || ""
}

function buildCompanyName(model?: string, color?: string): string | undefined {
  const m = (model || "").trim()
  const c = (color || "").trim()
  if (m && c) return `${m}/${c}`
  if (m) return m
  if (c) return c
  return undefined
}

function buildFamilyNameWithModel(familyName: string, model?: string): string {
  const m = (model || "").trim()
  const f = (familyName || "").trim()
  const composed = m ? `${m}/${f}` : f
  return composed.slice(0, 255)
}

const CAMPAIGN_PRICING = {
  プレミアムスタンダード: { regular: 980, campaign: 139 },
  コーティングプラス: { regular: 1280, campaign: 139 },
  スーパーシャンプーナイアガラ: { regular: 1480, campaign: 339 },
  セラミックコーティングタートルシェル: { regular: 2980, campaign: 1939 },
}

async function getOrCreateStaticPlan(courseName: string, regularPrice: number, campaignPrice: number): Promise<string> {
  try {
    console.log("[v0] 🔍 キャンペーン対応STATIC価格プランを検索中...")
    console.log("[v0] コース名:", courseName)
    console.log("[v0] 通常価格:", regularPrice, "円")
    console.log("[v0] キャンペーン価格:", campaignPrice, "円")

    const expectedPlanName = `${courseName}（固定額）`

    const searchResult = await squareClient.catalogApi.searchCatalogObjects({
      objectTypes: ["SUBSCRIPTION_PLAN"],
      limit: 100,
    })

    console.log("[v0] 検索結果:", searchResult.result.objects?.length || 0, "件のプランが見つかりました")

    if (searchResult.result.objects && searchResult.result.objects.length > 0) {
      for (const obj of searchResult.result.objects) {
        if (obj.isDeleted || !obj.presentAtAllLocations) {
          console.log("[v0] ⚠️ スキップ: 無効化されたプラン -", obj.subscriptionPlanData?.name)
          continue
        }

        const planName = obj.subscriptionPlanData?.name
        console.log("[v0] チェック中のプラン名:", planName)

        if (planName === expectedPlanName) {
          const variations = obj.subscriptionPlanData?.subscriptionPlanVariations || []
          for (const variation of variations) {
            const phases = variation.subscriptionPlanVariationData?.phases || []

            if (phases.length === 2) {
              const phase1Price = Number(phases[0].pricing?.priceMoney?.amount || 0)
              const phase2Price = Number(phases[1].pricing?.priceMoney?.amount || 0)

              if (
                phases[0].pricing?.type === "STATIC" &&
                phases[1].pricing?.type === "STATIC" &&
                phase1Price === campaignPrice &&
                phase2Price === regularPrice
              ) {
                console.log("[v0] ✅ 既存のキャンペーンプランを発見しました（重複回避）")
                console.log("[v0] プラン名:", planName)
                console.log("[v0] 初月価格:", phase1Price, "円")
                console.log("[v0] 2ヶ月目以降:", phase2Price, "円")
                console.log("[v0] プランバリエーションID:", variation.id)
                return variation.id!
              }
            }
          }
        }
      }
    }

    console.log("[v0] 既存のプランが見つからないため、新規作成します...")
    console.log("[v0] 作成するプラン名:", expectedPlanName)
    console.log("[v0] 初月キャンペーン価格:", campaignPrice, "円")
    console.log("[v0] 2ヶ月目以降通常価格:", regularPrice, "円")

    const planId = `#campaign-plan-${courseName.replace(/\s+/g, "-")}-${Date.now()}`
    const variationId = `#campaign-var-${courseName.replace(/\s+/g, "-")}-${Date.now()}`

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
                    ordinal: BigInt(0), // TypeScript requires bigint type
                    periods: BigInt(1), // TypeScript requires bigint type - Only 1 billing cycle for campaign
                    pricing: {
                      type: "STATIC",
                      priceMoney: {
                        amount: BigInt(campaignPrice),
                        currency: "JPY",
                      },
                    },
                  },
                  {
                    cadence: "MONTHLY",
                    ordinal: BigInt(1), // TypeScript requires bigint type
                    // No periods limit - continues indefinitely at regular price
                    pricing: {
                      type: "STATIC",
                      priceMoney: {
                        amount: BigInt(regularPrice),
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

    console.log("[v0] ✅ 新しいキャンペーンプランを作成しました")
    console.log("[v0] プランバリエーションID:", createdVariationId)
    console.log("[v0] 💡 初月:", campaignPrice, "円 → 2ヶ月目以降:", regularPrice, "円")

    return createdVariationId
  } catch (err) {
    console.error("[v0] ❌ キャンペーンプラン取得/作成エラー:", err)
    if (err instanceof ApiError) {
      console.error("[v0] Square APIエラー詳細:", err.errors)
    }
    throw err
  }
}

function getPricesFromCourseName(courseName: string): { regular: number; campaign: number } {
  return CAMPAIGN_PRICING[courseName as keyof typeof CAMPAIGN_PRICING] || { regular: 0, campaign: 0 }
}

export async function POST(request: Request) {
  let createdSquareCustomerId: string | null = null
  let cardId: string | null = null
  let subscriptionId: string | null = null

  try {
    const formData = await request.json()
    console.log("========================================")
    console.log("[v0] 受信したフォームデータ:", formData)
    console.log("========================================")

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
      campaignCode,
      enableSubscription,
    } = formData

    if (operation !== "入会") {
      return NextResponse.json({ success: false, error: "このエンドポイントは入会フロー専用です" }, { status: 400 })
    }

    console.log("[v0] 顧客情報を作成中...")
    const customersApi = squareClient.customersApi
    const finalReferenceId = referenceId || generateReferenceId(store)
    const companyNameCandidate = buildCompanyName(carModel, carColor)
    const cleanCourseName = extractCourseName(course)

    const formattedPhone = formatPhoneNumberToE164(phone)
    console.log("[v0] 電話番号を国際形式に変換:", phone, "→", formattedPhone)

    const customerNote = `店舗: ${store}\n洗車コース: ${cleanCourseName}`

    const createCustomerRequest: any = {
      givenName: givenName,
      familyName: buildFamilyNameWithModel(familyName, carModel),
      emailAddress: email,
      phoneNumber: formattedPhone,
      referenceId: finalReferenceId,
      nickname: cleanCourseName,
      note: customerNote,
    }
    if (companyNameCandidate) {
      createCustomerRequest.companyName = companyNameCandidate
    }

    const { result: customerResult } = await customersApi.createCustomer(createCustomerRequest)
    createdSquareCustomerId = customerResult.customer?.id || null

    if (!createdSquareCustomerId) {
      throw new Error("Square顧客の作成に失敗しました")
    }
    console.log("[v0] ✅ 顧客情報が作成されました:", createdSquareCustomerId)
    console.log("[v0] 顧客メモに洗車コース名を保存:", cleanCourseName)

    if (cardToken) {
      console.log("[v0] カード情報を保存中...", {
        customerId: createdSquareCustomerId,
        cardToken: cardToken.substring(0, 10) + "...",
      })
      try {
        const { result: cardResult } = await squareClient.cardsApi.createCard({
          idempotencyKey: `card-${createdSquareCustomerId}-${Date.now()}`,
          sourceId: cardToken,
          card: { customerId: createdSquareCustomerId },
        })
        cardId = cardResult.card?.id || null
        console.log("[v0] ✅ カード情報が正常に保存されました:", cardId)
      } catch (err) {
        console.error("[v0] ❌ カード登録エラー:", err)
        if (createdSquareCustomerId) {
          await customersApi.deleteCustomer(createdSquareCustomerId)
        }
        throw err
      }
    }

    if (enableSubscription && course && cardId) {
      console.log("========================================")
      console.log("[v0] 🔄 キャンペーンサブスクリプションを自動作成中...")
      console.log("[v0] 選択されたコース:", course)

      try {
        const prices = getPricesFromCourseName(cleanCourseName)
        const locationId = getLocationIdFromStoreName(store)

        console.log("[v0] コース名:", cleanCourseName)
        console.log("[v0] 初月キャンペーン価格:", prices.campaign, "円")
        console.log("[v0] 2ヶ月目以降通常価格:", prices.regular, "円")
        console.log("[v0] Location ID:", locationId)
        console.log("[v0] 顧客ID:", createdSquareCustomerId)
        console.log("[v0] カードID:", cardId)

        if (!prices.regular || !prices.campaign) {
          console.error("[v0] ❌ 価格が見つかりません:", cleanCourseName)
          throw new Error(`選択されたコース「${cleanCourseName}」の価格が設定されていません`)
        }

        if (!locationId) {
          console.error("[v0] ❌ Location IDが見つかりません:", store)
          throw new Error(`選択された店舗「${store}」に対応するLocation IDが見つかりません`)
        }

        const planVariationId = await getOrCreateStaticPlan(cleanCourseName, prices.regular, prices.campaign)

        const subscriptionRequest: any = {
          idempotencyKey: `sub-${createdSquareCustomerId}-${Date.now()}`,
          locationId: locationId,
          planVariationId: planVariationId,
          customerId: createdSquareCustomerId,
          cardId: cardId,
          startDate: new Date().toISOString().split("T")[0],
          timezone: "Asia/Tokyo",
        }

        console.log("[v0] サブスクリプションリクエスト:", subscriptionRequest)

        const { result: subscriptionResult } =
          await squareClient.subscriptionsApi.createSubscription(subscriptionRequest)

        subscriptionId = subscriptionResult.subscription?.id || null
        console.log("[v0] ✅ キャンペーンサブスクリプションが正常に作成されました!")
        console.log("[v0] サブスクリプションID:", subscriptionId)
        console.log("[v0] 💰 初月:", prices.campaign, "円が課金されます")
        console.log("[v0] 💰 2ヶ月目以降:", prices.regular, "円が自動課金されます")
        console.log("[v0] 💡 洗車コース名は顧客情報のメモ欄に保存されています")
        console.log("========================================")
      } catch (err) {
        console.error("========================================")
        console.error("[v0] ❌ サブスクリプション作成エラー:")
        console.error("[v0] エラー詳細:", err)
        if (err instanceof ApiError) {
          console.error("[v0] Square APIエラー:", err.errors)
        }
        console.error("========================================")

        if (createdSquareCustomerId) {
          await customersApi.deleteCustomer(createdSquareCustomerId)
        }
        throw new Error(
          `サブスクリプションの作成に失敗しました: ${err instanceof Error ? err.message : "不明なエラー"}`,
        )
      }
    } else {
      console.log("[v0] ⚠️ サブスクリプション作成がスキップされました")
      console.log("[v0] enableSubscription:", enableSubscription)
      console.log("[v0] course:", course)
      console.log("[v0] cardId:", cardId)
    }

    console.log("[v0] Google Sheetsに即座に書き込み中...")
    const sheetsData = [
      formatJapanDateTime(new Date()),
      operation,
      finalReferenceId,
      store,
      `${familyName} ${givenName}`,
      email,
      "",
      phone,
      carModel || "",
      carColor || "",
      licensePlate || "",
      extractCourseName(course),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      campaignCode || "",
    ]

    try {
      await appendToSheet([sheetsData])
      console.log("[v0] ✅ Google Sheets書き込み成功（即座に反映完了）")
    } catch (err) {
      console.error("[v0] ❌ Google Sheets書き込みエラー:", err)
    }

    console.log("[v0] 確認メール送信中...")
    try {
      await sendConfirmationEmail(`${familyName} ${givenName}`, email, course, store, finalReferenceId)
      console.log("[v0] ✅ 確認メール送信成功")
    } catch (err) {
      console.error("[v0] ❌ 確認メール送信エラー:", err)
    }

    return NextResponse.json({
      success: true,
      customerId: createdSquareCustomerId,
      referenceId: finalReferenceId,
      subscriptionId: subscriptionId,
      message: subscriptionId
        ? "入会が完了し、キャンペーンサブスクリプションが作成されました（初月キャンペーン価格、2ヶ月目以降通常価格で自動課金されます）"
        : "入会が完了しました（スプレッドシートに即座に反映されました）",
    })
  } catch (error) {
    console.error("========================================")
    console.error("[v0] ❌ エラーが発生しました:", error)
    console.error("========================================")

    if (createdSquareCustomerId) {
      try {
        const deletePromise = squareClient.customersApi.deleteCustomer(createdSquareCustomerId)
        const deleteTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Square顧客削除がタイムアウトしました")), 3000)
        })
        await Promise.race([deletePromise, deleteTimeout])
        console.log("作成されたSquare顧客を削除しました:", createdSquareCustomerId)
      } catch (deleteError) {
        console.error("Square顧客の削除に失敗しました:", deleteError)
      }
    }

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

function formatPhoneNumberToE164(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "")

  // If it starts with 0 (Japanese domestic format), replace with +81
  if (digitsOnly.startsWith("0")) {
    return `+81${digitsOnly.substring(1)}`
  }

  // If it already starts with 81, add +
  if (digitsOnly.startsWith("81")) {
    return `+${digitsOnly}`
  }

  // If it already has +, return as is
  if (phone.startsWith("+")) {
    return phone
  }

  // Default: assume Japanese number and add +81
  return `+81${digitsOnly}`
}
