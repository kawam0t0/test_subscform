import { NextResponse } from "next/server"
import { Client, Environment } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { sendInquiryConfirmationEmail } from "../../utils/email-sender"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractIdentifierAndModel(familyName: string): { identifier: string; model: string } {
  const identifiers = ["CE", "ME", "YK", "MB"]
  for (const id of identifiers) {
    if (familyName.startsWith(id)) {
      const remainingPart = familyName.slice(id.length)
      const model = remainingPart.split("/")[0].trim()
      return { identifier: id, model }
    }
  }

  // 「車種/姓」の形式かどうかをチェック
  const parts = familyName.split("/")
  if (parts.length > 1) {
    return { identifier: "", model: parts[0].trim() }
  }

  return { identifier: "", model: familyName }
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      operation,
      familyName,
      givenName,
      email,
      phone,
      store,
      currentCourse,
      newCourse,
      carModel,
      carColor,
      cardToken,
      newCarModel,
      newCarColor,
      newEmail,
      membershipNumber, // 会員番号を追加
    } = formData

    // 姓名+電話番号+車種での検索
    const fullName = `${familyName} ${givenName}`

    // メールアドレス+電話番号+車種での検索
    // まずメールアドレスで候補を絞り込む
    const { result: emailSearchResult } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    let matchingCustomer: any = null

    // メールアドレスで見つかった顧客の中から、電話番号と車種が一致するものを探す
    if (emailSearchResult.customers && emailSearchResult.customers.length > 0) {
      for (const customer of emailSearchResult.customers) {
        // 電話番号の確認
        const customerPhone = customer.phoneNumber || ""

        // 車種の確認（companyNameから車種を抽出）
        let customerCarModel = ""
        if (customer.companyName) {
          const companyParts = customer.companyName.split("/")
          if (companyParts.length > 0) {
            customerCarModel = companyParts[0].trim()
          }
        }

        // 電話番号と車種が一致する場合
        if (customerPhone === phone && customerCarModel === carModel) {
          matchingCustomer = customer
          break
        }
      }
    }

    console.log("検索結果:", {
      searchCriteria: { email, phone, carModel },
      foundCustomer: matchingCustomer ? matchingCustomer.id : "見つかりません",
      totalCandidates: emailSearchResult.customers?.length || 0,
    })

    // 顧客が見つからない場合の処理を変更
    let customerId: string | null = null
    let wasCustomerFound = false

    if (matchingCustomer && matchingCustomer.id) {
      customerId = matchingCustomer.id
      wasCustomerFound = true
      console.log("一致する顧客が見つかりました:", customerId)

      // 既存の車種情報を取得
      let existingCarModel = carModel

      // matchingCustomerのcompanyNameから車種を取得（形式は「車種/色」を想定）
      if (matchingCustomer.companyName) {
        const companyParts = matchingCustomer.companyName.split("/")
        if (companyParts.length > 0) {
          existingCarModel = companyParts[0].trim()
        }
      }

      // familyNameから車種を取得（形式は「車種/姓」を想定）- 既存データとの互換性のため
      if (!existingCarModel && matchingCustomer.familyName) {
        const { model } = extractIdentifierAndModel(matchingCustomer.familyName)
        if (model && model !== matchingCustomer.familyName) {
          existingCarModel = model
        }
      }

      // 更新データの準備
      const updateData: any = {
        givenName: givenName,
        familyName: familyName, // 姓のみを格納
        emailAddress: operation === "メールアドレス変更" ? newEmail : email,
        phoneNumber: phone,
        note: store,
      }

      // 操作タイプに応じてcompanyNameを設定
      if (operation === "登録車両変更") {
        // 登録車両変更の場合、companyNameに新しい車両詳細を設定（車種/色形式）
        updateData.companyName = `${newCarModel}/${newCarColor}`
      } else {
        // その他の操作の場合、既存の車両情報を保持
        if (matchingCustomer.companyName) {
          updateData.companyName = matchingCustomer.companyName
        } else if (carModel && carColor) {
          updateData.companyName = `${carModel}/${carColor}`
        }
      }

      // コース変更時
      if (operation === "洗車コース変更") {
        updateData.note = `${store}, コース: ${newCourse.split("（")[0].trim()}`
      }

      // 顧客情報を更新
      if (customerId) {
        const { result: updateResult } = await squareClient.customersApi.updateCustomer(customerId, updateData)
      }

      // クレジットカード情報の更新
      if (operation === "クレジットカード情報変更" && cardToken && customerId) {
        const { result: existingCards } = await squareClient.cardsApi.listCards()
        const customerCards = existingCards.cards?.filter((card) => card.customerId === customerId) || []

        // 既存のカードを無効化
        for (const card of customerCards) {
          if (card.id) {
            await squareClient.cardsApi.disableCard(card.id)
          }
        }

        // 新しいカードを追加
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
      }
    } else {
      console.log("一致する顧客が見つかりませんでした。スプレッドシートにのみ記録します。")
    }

    // Google Sheetsにデータを追加（顧客が見つからなくても必ず実行）
    const sheetData = [
      formatJapanDateTime(new Date()), // A列
      operation, // B列
      wasCustomerFound && matchingCustomer ? matchingCustomer.referenceId || "" : "", // C列
      store, // D列
      `${familyName} ${givenName}`, // E列
      email, // F列
      operation === "メールアドレス変更" ? newEmail : "", // G列
      phone, // H列
      carModel || newCarModel || "", // I列
      carColor || newCarColor, // J列
      "", // K列: ナンバー（削除済み）
      currentCourse || "", // L列
      newCarModel || "", // M列
      newCarColor || "", // N列
      "", // O列: 新しいナンバープレート（削除済み）
      newCourse || "", // P列
      "", // Q列: その他（submit-inquiryで利用）
      "", // R列: 空白
      membershipNumber || "", // S列: 会員番号
    ]
    await appendToSheet([sheetData])
    console.log("Google Sheetsにデータが記録されました")

    // メール送信処理（顧客が見つかった場合のみ）
    if (wasCustomerFound) {
      try {
        const details: any = {}

        if (operation === "登録車両変更") {
          details.newCarModel = newCarModel
          details.newCarColor = newCarColor
        } else if (operation === "洗車コース変更") {
          details.currentCourse = currentCourse
          details.newCourse = newCourse
        } else if (operation === "メールアドレス変更") {
          details.newEmail = newEmail
        }

        await sendInquiryConfirmationEmail(
          `${familyName} ${givenName}`,
          operation === "メールアドレス変更" ? newEmail : email,
          operation,
          store,
          details,
        )
        console.log("問い合わせ確認メールを送信しました")
      } catch (emailError) {
        console.error("メール送信中にエラーが発生しました:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      customerId: customerId,
      customerFound: wasCustomerFound,
      message: wasCustomerFound
        ? "顧客情報が正常に更新されました"
        : "該当する顧客が見つかりませんでしたが、お問い合わせ内容は記録されました",
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
