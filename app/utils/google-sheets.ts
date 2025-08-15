import { google } from "googleapis"
import type { JWT } from "google-auth-library"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

async function getAuthClient(): Promise<JWT> {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Google Sheets credentials are not properly configured. Please check GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_CLIENT_EMAIL in your environment variables.",
    )
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, "\n").replace(/"/g, "")

  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: formattedPrivateKey,
      client_email: clientEmail,
    },
    scopes: SCOPES,
  })

  const client = (await auth.getClient()) as JWT
  return client
}

// appendToSheet関数をexportする
export async function appendToSheet(values: string[][]) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  console.log("[DEBUG] Google Sheets環境変数チェック:", {
    spreadsheetId: spreadsheetId ? "SET" : "NOT_SET",
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY ? "SET" : "NOT_SET",
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? "SET" : "NOT_SET",
  })

  if (!spreadsheetId) {
    console.error("[ERROR] GOOGLE_SHEETS_SPREADSHEET_ID is not configured")
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured in your environment variables.")
  }

  try {
    console.log("[DEBUG] 認証クライアント取得開始...")
    const authClient = await getAuthClient()
    console.log("[DEBUG] 認証クライアント取得成功")

    const sheets = google.sheets({ version: "v4", auth: authClient })

    // すべての値を文字列に変換
    const stringValues = values.map((row) =>
      row.map((cell) => (cell === undefined || cell === null ? "" : cell.toString())),
    )

    // デバッグ用のログ
    console.log("[DEBUG] Attempting to append data with:", {
      spreadsheetId,
      range: "customer_info!A:T", // T列まで拡張
      values: stringValues,
    })

    // APIリクエストの構造を修正
    const request = {
      spreadsheetId,
      range: "customer_info!A:T", // T列まで拡張
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: stringValues,
      },
    }

    console.log("[DEBUG] Google Sheets API呼び出し開始...")
    const response = await sheets.spreadsheets.values.append(request)
    console.log("[SUCCESS] Data appended successfully:", response.data)
    return response.data
  } catch (error) {
    console.error("[ERROR] Google Sheets書き込みエラー:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    throw new Error(
      `Failed to append data to Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
