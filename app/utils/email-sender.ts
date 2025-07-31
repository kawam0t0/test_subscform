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

// sendConfirmationEmail関数を修正して、キャンペーン適用時の特別なメールテンプレートを追加

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

  // キャンペーン適用かどうかをチェック
  const isCampaignApplied = course.includes("キャンペーン")

  // 現在の年を取得
  const currentYear = new Date().getFullYear()

  // キャンペーン適用時の特別なメールテンプレート
  if (isCampaignApplied) {
    const mailOptions = {
      from: `"SPLASH'N'GO!" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "【キャンペーン登録完了】SPLASH'N'GO!新前橋店",
      html: `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale: 1.0">
          <title>SPLASH'N'GO! キャンペーン登録完了</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Noto Sans JP', sans-serif; color: #333333; background-color: #f5f5f5;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <!-- キャンペーンヘッダー -->
            <tr>
              <td style="padding: 0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%); padding: 30px 20px; text-align: center; position: relative;">
                      <div style="position: absolute; top: 10px; left: 20px; font-size: 24px;"></div>
                      <div style="position: absolute; top: 10px; right: 20px; font-size: 24px;"></div>
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: 1px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">SPLASH'N'GO!</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 18px; font-weight: 600;">キャンペーン登録完了！</p>
                      <div style="margin-top: 15px; padding: 10px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-block;">
                        <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">2ヶ月無料キャンペーン適用中</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- メインコンテンツ -->
            <tr>
              <td style="padding: 30px 30px 20px;">
                <p style="font-size: 16px; margin-top: 0; margin-bottom: 20px; font-weight: 500;">${name} 様</p>
                
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">この度は、SPLASH'N'GO!新前橋店のキャンペーンにお申し込みいただき、誠にありがとうございます！</p>
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;"><strong>おめでとうございます！</strong> キャンペーンが適用され、以下の内容で登録が完了しました。</p>
                
                <!-- キャンペーン特典ボックス -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FFE5B4 0%, #FFCC5C 100%); border-radius: 12px; margin-bottom: 25px; overflow: hidden; border: 3px solid #FF6B35;">
                  <tr>
                    <td style="padding: 25px; text-align: center;">
                      <h3 style="margin: 0 0 15px; font-size: 20px; color: #D2691E; font-weight: 700;">特別キャンペーン特典</h3>
                      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #FF6B35;">最初の2ヶ月間：完全無料！</p>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #666; text-decoration: line-through;">通常価格：月額980円</p>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #D2691E; font-weight: 600;">3ヶ月目以降：月額980円でご利用いただけます</p>
                    </td>
                  </tr>
                </table>
                
                <!-- 登録情報ボックス -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(to right, #f0f7ff, #e6f2ff); border-radius: 8px; margin-bottom: 25px; overflow: hidden; border-left: 4px solid #0062E6;">
                  <tr>
                    <td style="padding: 20px;">
                      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">会員ID:</strong> <span style="font-family: monospace; font-size: 16px; letter-spacing: 0.5px;">${referenceId}</span></p>
                      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">店舗:</strong> ${store}</p>
                      <p style="margin: 0 0 12px; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">選択コース:</strong> ${courseName}</p>
                      <p style="margin: 0; font-size: 15px;"><strong style="display: inline-block; width: 100px; color: #0062E6;">キャンペーン:</strong> <span style="color: #FF6B35; font-weight: 600;">2ヶ月無料適用中</span></p>
                    </td>
                  </tr>
                </table>
                
                <!-- 重要なお知らせ -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #E8F5E8 0%, #F0FFF0 100%); border-radius: 8px; margin-bottom: 25px; border: 2px solid #32CD32;">
                  <tr>
                    <td style="padding: 20px;">
                      <h4 style="margin: 0 0 15px; font-size: 16px; color: #228B22; font-weight: 600;">キャンペーンご利用について</h4>
                      <ul style="margin: 0; padding-left: 20px; color: #2F4F2F;">
                        <li style="margin-bottom: 8px;">お申し込み頂きました新前橋店にて会員カードをお受け取りください</li>
                        <li style="margin-bottom: 8px;">最初の2ヶ月間は料金が発生いたしません</li>
                        <li style="margin-bottom: 8px;">3ヶ月目から月額980円の自動課金が開始されます</li>
                        <li style="margin-bottom: 0;">キャンペーン期間中でも通常通りサービスをご利用いただけます</li>
                      </ul>
                    </td>
                  </tr>
                </table>
                
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px; color: #FF6B35; font-weight: 600;">素敵なカーライフをSPLASH'N'GO!でお楽しみください！</p>
                
                <!-- お問い合わせ情報 -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 15px;">
                      <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #555;">メール:</strong> <a href="mailto:info@splashbrothers.co.jp" style="color: #0062E6; text-decoration: none;">info@splashbrothers.co.jp</a></p>
                      <p style="margin: 0; font-size: 14px;"><strong style="color: #555;">電話:</strong> <a href="tel:050-1748-0947" style="color: #0062E6; text-decoration: none;">050-1748-0947</a></p>
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
                    <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 20px; text-align: center;">
                      <p style="margin: 0 0 10px; font-size: 16px; color: white; font-weight: 600;">🎉 SPLASH'N'GO! キャンペーン 🎉</p>
                      <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.9);">※このメールは自動送信されています。返信はできませんのでご了承ください。</p>
                      <p style="margin: 15px 0 0; font-size: 12px; color: rgba(255,255,255,0.8);">© ${currentYear} SPLASH'N'GO! All Rights Reserved.</p>
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

    // キャンペーンメール送信
    try {
      await transporter.sendMail(mailOptions)
      console.log("キャンペーン確認メールが送信されました")
      return true
    } catch (error) {
      console.error("キャンペーンメール送信エラー:", error)
      return false
    }
  }

  // 通常の入会確認メール（既存のコード）
  const mailOptions = {
    from: `"SPLASH'N'GO!" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "【登録完了のご連絡】SPLASH'N'GO!",
    html: `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale: 1.0">
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
        <meta name="viewport" content="width=device-width, initial-scale: 1.0">
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
