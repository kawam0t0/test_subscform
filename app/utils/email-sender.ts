import nodemailer from "nodemailer"

// メールトランスポーターの作成
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// 入会確認メール送信関数
export async function sendConfirmationEmail(
  name: string,
  email: string,
  course: string,
  store: string,
  referenceId: string,
) {
  const transporter = createTransporter()

  // コース名から金額を除去する
  const courseName = course.split("（")[0].trim()

  // 現在の年を取得
  const currentYear = new Date().getFullYear()

  // メールオプションの設定
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

// 問い合わせ受付確認メール送信関数
export async function sendInquiryConfirmationEmail(
  name: string,
  email: string,
  operation: string,
  store: string,
  details: any = {},
) {
  const transporter = createTransporter()

  // 現在の年を取得
  const currentYear = new Date().getFullYear()

  // 操作タイプに応じたタイトルと説明を設定
  let title = "お問い合わせ受付のご連絡"
  let description = "以下の内容でお問い合わせを受け付けました。"
  let operationTitle = "お問い合わせ内容"

  switch (operation) {
    case "登録車両変更":
      title = "車両変更受付のご連絡"
      description = "以下の内容で車両変更を受け付けました。"
      operationTitle = "変更内容"
      break
    case "洗車コース変更":
      title = "コース変更受付のご連絡"
      description = "以下の内容でコース変更を受け付けました。"
      operationTitle = "変更内容"
      break
    case "クレジットカード情報変更":
      title = "カード情報変更受付のご連絡"
      description = "以下の内容でカード情報変更を受け付けました。"
      operationTitle = "変更内容"
      break
    case "メールアドレス変更":
      title = "メールアドレス変更受付のご連絡"
      description = "以下の内容でメールアドレス変更を受け付けました。"
      operationTitle = "変更内容"
      break
    case "各種手続き":
      title = "お問い合わせ受付のご連絡"
      description = "以下の内容でお問い合わせを受け付けました。"
      operationTitle = "お問い合わせ内容"
      break
  }

  // 詳細情報の表示を準備
  let detailsHtml = ""

  if (operation === "登録車両変更" && details.newCarModel && details.newCarColor) {
    detailsHtml += `
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">新しい車種:</strong> ${details.newCarModel}</p>
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">新しい車の色:</strong> ${details.newCarColor}</p>
    `
  } else if (operation === "洗車コース変更" && details.currentCourse && details.newCourse) {
    detailsHtml += `
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">現在のコース:</strong> ${details.currentCourse}</p>
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">新しいコース:</strong> ${details.newCourse}</p>
    `
  } else if (operation === "メールアドレス変更" && details.newEmail) {
    detailsHtml += `
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">新しいメールアドレス:</strong> ${details.newEmail}</p>
    `
  } else if (operation === "各種手続き" && details.inquiryDetails) {
    detailsHtml += `
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">お問い合わせ詳細:</strong></p>
      <p style="margin: 0 0 12px; font-size: 15px; white-space: pre-wrap; padding-left: 10px;">${details.inquiryDetails}</p>
    `
  } else if (operation === "クレジットカード情報変更") {
    detailsHtml += `
      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">カード情報:</strong> 新しいカード情報が登録されました</p>
    `
  }

  // メールオプションの設定
  const mailOptions = {
    from: `"SPLASH'N'GO!" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `【${title}】SPLASH'N'GO!`,
    html: `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SPLASH'N'GO! ${title}</title>
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
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${title}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- メインコンテンツ -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="font-size: 16px; margin-top: 0; margin-bottom: 20px; font-weight: 500;">${name} 様</p>
              
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">いつもSPLASH'N'GO!をご利用いただき、誠にありがとうございます。</p>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">${description}</p>
              
              <!-- 問い合わせ情報ボックス -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(to right, #f0f7ff, #e6f2ff); border-radius: 8px; margin-bottom: 25px; overflow: hidden; border-left: 4px solid #0062E6;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">店舗:</strong> ${store}</p>
                    <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 120px; color: #0062E6;">${operationTitle}:</strong> ${operation}</p>
                    ${detailsHtml}
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">内容を確認次第、担当者よりご連絡させていただく場合がございます。</p>
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
    console.log("問い合わせ確認メールが送信されました")
    return true
  } catch (error) {
    console.error("メール送信エラー:", error)
    return false
  }
}
