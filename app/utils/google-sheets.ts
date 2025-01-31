import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

async function getAuthClient() {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Google Sheets credentials are not properly configured. Please check GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_CLIENT_EMAIL in your environment variables.",
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: privateKey.replace(/\\n/g, "\n"),
      client_email: clientEmail,
    },
    scopes: SCOPES,
  })
  return auth.getClient()
}

export async function appendToSheet(values: string[][]) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured in your environment variables.")
  }

  try {
    const authClient = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth: authClient })

    // Ensure all values are strings
    const stringValues = values.map((row) => row.map((cell) => cell.toString()))

    // デバッグ用のログ
    console.log("Attempting to append data with:", {
      spreadsheetId,
      range: "customer_info!A:M",
      values: stringValues,
    })

    // APIリクエストの構造を修正
    const request = {
      spreadsheetId,
      range: "customer_info!A:M",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: stringValues,
      },
    }

    const response = await sheets.spreadsheets.values.append(request)

    console.log("Data appended successfully:", response.data)
    return response.data
  } catch (error) {
    console.error("Detailed error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    throw new Error(
      `Failed to append data to Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

