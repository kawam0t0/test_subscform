import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { insertCustomer, type InsertCustomerData } from "../../utils/cloudsql"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import { sendConfirmationEmail } from "../../utils/email-sender"

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

export async function POST(request: Request) {
  let createdSquareCustomerId: string | null = null

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
      campaignCode,
    } = formData

    if (operation !== "入会") {
      return NextResponse.json({ success: false, error: "このエンドポイントは入会フロー専用です" }, { status: 400 })
    }

    console.log("顧客情報を作成中...")
    const customersApi = squareClient.customersApi
    const finalReferenceId = referenceId || generateReferenceId(store)
    const companyNameCandidate = buildCompanyName(carModel, carColor)

    const createCustomerRequest: any = {
      givenName: givenName,
      familyName: buildFamilyNameWithModel(familyName, carModel),
      emailAddress: email,
      phoneNumber: phone,
      referenceId: finalReferenceId,
      nickname: extractCourseName(course),
      note: store,
    }
    if (companyNameCandidate) {
      createCustomerRequest.companyName = companyNameCandidate
    }

    const { result: customerResult } = await customersApi.createCustomer(createCustomerRequest)
    createdSquareCustomerId = customerResult.customer?.id || null

    if (!createdSquareCustomerId) {
      throw new Error("Square顧客の作成に失敗しました")
    }
    console.log("顧客情報が作成されました:", createdSquareCustomerId)

    if (cardToken) {
      console.log("カード情報を保存中...", {
        customerId: createdSquareCustomerId,
        cardToken: cardToken.substring(0, 10) + "...",
      })
      try {
        const { result: cardResult } = await squareClient.cardsApi.createCard({
          idempotencyKey: `card-${createdSquareCustomerId}-${Date.now()}`,
          sourceId: cardToken,
          card: { customerId: createdSquareCustomerId },
        })
        console.log("カード情報が正常に保存されました:", cardResult.card?.id)
      } catch (err) {
        console.error("カード登録エラー:", err)
        if (createdSquareCustomerId) {
          await customersApi.deleteCustomer(createdSquareCustomerId)
        }
        throw err
      }
    }

    console.log("CloudSQLに顧客データを挿入中...")
    const customerData: InsertCustomerData = {
      referenceId: finalReferenceId,
      squareCustomerId: createdSquareCustomerId,
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
      storeName: store,
      campaignCode: campaignCode || null,
    }

    // CloudSQL操作にタイムアウトを設定（8秒）
    const cloudSqlPromise = insertCustomer(customerData)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("CloudSQL操作がタイムアウトしました")), 8000)
    })

    let cloudSqlCustomerId: number
    try {
      cloudSqlCustomerId = (await Promise.race([cloudSqlPromise, timeoutPromise])) as number
      console.log("CloudSQLに顧客データが正常に挿入されました:", cloudSqlCustomerId)
    } catch (cloudSqlError) {
      console.error("CloudSQL挿入エラー:", cloudSqlError)
      // CloudSQLエラーでもSquare顧客は保持し、成功レスポンスを返す
      console.log("CloudSQLエラーが発生しましたが、Square顧客は正常に作成されました")

      // バックグラウンドでGoogle Sheetsとメール送信を実行
      Promise.all([
        appendToSheet([
          [
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
          ],
        ]).catch((err) => console.error("Google Sheets書き込みエラー:", err)),
        sendConfirmationEmail(`${familyName} ${givenName}`, email, course, store, finalReferenceId).catch((err) =>
          console.error("確認メール送信エラー:", err),
        ),
      ])

      return NextResponse.json({
        success: true,
        customerId: createdSquareCustomerId,
        referenceId: finalReferenceId,
        message: "入会が完了しました（データベース同期は後で実行されます）",
        warning: "データベース同期に時間がかかっています",
      })
    }

    // Google SheetsとEmail送信を並行実行（エラーでも処理を継続）
    const backgroundTasks = [
      appendToSheet([
        [
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
        ],
      ]).catch((err) => console.error("Google Sheets書き込みエラー:", err)),
      sendConfirmationEmail(`${familyName} ${givenName}`, email, course, store, finalReferenceId).catch((err) =>
        console.error("確認メール送信エラー:", err),
      ),
    ]

    // バックグラウンドタスクを並行実行（結果を待たない）
    Promise.all(backgroundTasks).then(() => {
      console.log("バックグラウンドタスクが完了しました")
    })

    return NextResponse.json({
      success: true,
      customerId: createdSquareCustomerId,
      cloudSqlCustomerId,
      referenceId: finalReferenceId,
      message: "入会が完了しました",
    })
  } catch (error) {
    console.error("エラーが発生しました:", error)

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
        message: "お手数ですが、しばらく時間をおいて再度お試しください",
      },
      { status: 500 },
    )
  }
}
