import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractExistingCourse(note: string | null | undefined): string {
  if (!note) return ""
  const courseMatch = note.match(/コース: (.+?)(?:,|$)/)
  return courseMatch ? courseMatch[1].trim() : ""
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      operation,
      name,
      email,
      phone,
      store,
      currentCourse,
      newCourse,
      carModel,
      carColor,
      licensePlate,
      cardToken,
      newCarModel,
      newCarColor,
      newLicensePlate,
    } = formData

    // メールアドレスで顧客を検索
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    // メールアドレスとナンバープレートで顧客を特定
    const existingCustomers = emailSearchResult.customers || []
    const matchingCustomer = existingCustomers.find(
      (customer) => customer.familyName && customer.familyName.split("/")[2] === licensePlate,
    )

    if (!matchingCustomer || !matchingCustomer.id) {
      throw new Error("指定されたメールアドレスとナンバープレートに一致する顧客が見つかりません")
    }

    const customerId = matchingCustomer.id

    if (operation === "洗車コース変更") {
      // コース変更の場合は、noteフィールドを新しいコースで更新
      const newCourseName = newCourse.split("（")[0].trim()

      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${newCourseName}`,
      })

      await appendToSheet([
        [
          new Date().toISOString(),
          operation,
          store,
          name,
          email,
          phone,
          carModel,
          carColor,
          licensePlate,
          currentCourse,
          newCourse,
          customerId,
        ],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "コース情報が正常に更新されました",
      })
    } else if (operation === "登録車両変更") {
      const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        familyName: `${newCarModel}/${newCarColor}/${newLicensePlate}`,
        emailAddress: email,
        phoneNumber: phone,
      })

      console.log("顧客情報が更新されました:", updateResult.customer)

      await appendToSheet([
        [
          new Date().toISOString(),
          operation,
          store,
          name,
          email,
          phone,
          newCarModel,
          newCarColor,
          newLicensePlate,
          customerId,
        ],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報が正常に更新されました",
      })
    } else if (operation === "クレジットカード情報変更") {
      const existingCourse = extractExistingCourse(matchingCustomer.note)

      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: name,
        emailAddress: email,
        phoneNumber: phone,
        note: `店舗: ${store}, コース: ${existingCourse}`,
      })

      if (cardToken) {
        const { result: existingCards } = await squareClient.cardsApi.listCards()
        const customerCards = existingCards.cards?.filter((card) => card.customerId === customerId) || []
        for (const card of customerCards) {
          if (card.id) {
            await squareClient.cardsApi.disableCard(card.id)
            console.log(`古いカードID: ${card.id} を無効化しました`)
          }
        }

        const { result: cardResult } = await squareClient.cardsApi.createCard({
          idempotencyKey: `${customerId}-${Date.now()}`,
          sourceId: cardToken,
          card: {
            customerId: customerId,
          },
        })

        if (!cardResult.card || !cardResult.card.id) {
          throw new Error("カード情報の保存に失敗しました")
        }

        console.log("新しいカードが正常に追加され、古いカードは無効化されました")
      }

      await appendToSheet([
        [new Date().toISOString(), operation, store, name, email, phone, store, existingCourse, customerId],
      ])

      return NextResponse.json({
        success: true,
        customerId: customerId,
        message: "顧客情報とクレジットカード情報が正常に更新されました",
      })
    }

    return NextResponse.json({
      success: true,
      message: "処理が完了しました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

