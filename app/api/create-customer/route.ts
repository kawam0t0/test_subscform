import { NextResponse } from "next/server"
import { Client, Environment, ApiError } from "square"
import { appendToSheet } from "../../utils/google-sheets"
import { formatJapanDateTime } from "../../utils/date-utils"
import { generateReferenceId } from "../../utils/reference-id"
import nodemailer from "nodemailer"

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
})

function extractCourseName(course: string): string {
  return course.split("（")[0].trim()
}

// メール送信関数を改善
async function sendConfirmationEmail(name: string, email: string, course: string, store: string, referenceId: string) {
  // トランスポーターの作成
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  // コース名から金額を除去する
  const courseName = course.split("（")[0].trim()

  // 現在の年を取得
  const currentYear = new Date().getFullYear()

  // メールオプションの設定 - デザインを大幅に改善
  const mailOptions = {
    from: `"SPLASH'N'GO!" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "【登録完了のご連絡】SPLASH'N'GO!",
    html: `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SPLASH'N'GO! 登録完了</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Noto Sans JP', sans-serif; color: #333333; background-color: #f5f5f5;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <!-- ヘッダー -->
          <tr>
            <td style="padding: 0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #0062E6 0%, #33A1FD 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: 1px;">SPLASH'N'GO!</h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">登録完了のご連絡</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- メインコンテンツ -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="font-size: 16px; margin-top: 0; margin-bottom: 20px; font-weight: 500;">${name} 様</p>
              
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">SPLASH'N'GO!にご入会いただき、誠にありがとうございます。</p>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">以下の内容で登録が完了しました。</p>
              
              <!-- 登録情報ボックス -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(to right, #f0f7ff, #e6f2ff); border-radius: 8px; margin-bottom: 25px; overflow: hidden; border-left: 4px solid #0062E6;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">会員ID:</strong> <span style="font-family: monospace; font-size: 16px; letter-spacing: 0.5px;">${referenceId}</span></p>
                    <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">店舗:</strong> ${store}</p>
                    <p style="margin: 0; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">選択コース:</strong> ${courseName}</p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">お申し込み頂きました店舗にて会員カードをお受け取り下さいませ。</p>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
              
              <!-- お問い合わせ情報 -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #555;">メール:</strong> <a href="mailto:info@splashbrothers.co.jp" style="color: #0062E6; text-decoration: none;">info@splashbrothers.co.jp</a></p>
                    <p style="margin: 0; font-size: 14px;"><strong style="color: #555;">電話:</strong> <a href="tel:050-1748-2159" style="color: #0062E6; text-decoration: none;">050-1748-0947</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- フッター -->
          <tr>
            <td style="padding: 0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6c757d;">SPLASH'N'GO!</p>
                    <p style="margin: 0; font-size: 12px; color: #adb5bd;">※このメールは自動送信されています。返信はできませんのでご了承ください。</p>
                    <p style="margin: 15px 0 0; font-size: 12px; color: #adb5bd;">© ${currentYear} SPLASH'N'GO! All Rights Reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }

  // メール送信
  try {
    await transporter.sendMail(mailOptions)
    console.log("確認メールが送信されました")
    return true
  } catch (error) {
    console.error("メール送信エラー:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("受信したフォームデータ:", formData)

    const {
      familyName,
      givenName,
      email,
      phone,
      carModel,
      carColor,
      course,
      store,
      operation,
      cardToken,
      licensePlate,
    } = formData

    if (operation === "入会") {
      const referenceId = generateReferenceId(store)
      const courseName = extractCourseName(course)

      // 1. 顧客情報を作成
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        idempotencyKey: `${Date.now()}-${Math.random()}`,
        givenName: givenName,
        familyName: `${carModel}/${familyName}`, // 車種/姓 の形式に変更
        emailAddress: email,
        phoneNumber: phone,
        companyName: `${carModel}/${carColor}/${licensePlate}`,
        referenceId: referenceId,
        note: store,
        nickname: courseName,
      })

      if (!customerResult.customer?.id) {
        throw new Error("顧客の作成に失敗しました")
      }

      const customerId = customerResult.customer.id

      // 2. カード情報の処理（存在する場合）
      if (cardToken) {
        try {
          const { result: cardResult } = await squareClient.cardsApi.createCard({
            idempotencyKey: `${customerId}-${Date.now()}`,
            sourceId: cardToken,
            card: {
              customerId: customerId,
            },
          })

          if (!cardResult.card || !cardResult.card.id) {
            // カード情報の保存に失敗した場合、作成した顧客情報を削除
            await squareClient.customersApi.deleteCustomer(customerId)
            throw new Error("カード情報の保存に失敗しました")
          }

          console.log("カード情報が正常に保存されました:", cardResult.card.id)
        } catch (cardError) {
          // カードエラーが発生した場合、作成した顧客情報を削除
          console.error("カード処理エラー:", cardError)
          await squareClient.customersApi.deleteCustomer(customerId)

          // APIエラーの場合は詳細なエラーメッセージを取得
          if (cardError instanceof ApiError) {
            const errorDetail = cardError.errors?.[0]?.detail || cardError.message
            throw new Error(`クレジットカードエラー: ${errorDetail}`)
          } else {
            throw new Error("クレジットカード情報が無効です。正しい情報を入力してください。")
          }
        }
      }

      // 3. Google Sheetsにデータを追加
      await appendToSheet([
        [
          formatJapanDateTime(new Date()), // A列: タイムスタンプ
          operation, // B列: 操作
          referenceId, // C列: リファレンスID
          store, // D列: 店舗
          `${familyName} ${givenName}`, // E列: 名前
          email, // F列: メールアドレス
          "", // G列: 新しいメールアドレス
          phone, // H列: 電話番号
          carModel, // I列: 車種
          carColor, // J列: 車の色
          licensePlate, // K列: ナンバー
          courseName, // L列: 洗車コース名
          "", // M列: 新しい車種
          "", // N列: 新しい車の色
          "", // O列: 新しいナンバープレート
          "", // P列: 新しいコース
          "", // Q列: その他
        ],
      ])

      // メール送信
      try {
        await sendConfirmationEmail(`${familyName} ${givenName}`, email, course, store, referenceId)
        console.log("入会確認メールを送信しました")
      } catch (emailError) {
        console.error("メール送信中にエラーが発生しました:", emailError)
        // メール送信エラーは処理を中断しない
      }

      return NextResponse.json({
        success: true,
        customerId: customerId,
        referenceId: referenceId,
        message: "顧客情報が正常に登録されました",
      })
    }

    return NextResponse.json({
      success: false,
      error: "この操作は入会フロー以外では利用できません",
    })
  } catch (error) {
    console.error("エラー発生:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      },
      { status: 500 },
    )
  }
}

