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

  // プライベートキーの処理を改善
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


