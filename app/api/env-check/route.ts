import { NextResponse } from "next/server"

export async function GET() {
  // 機密値は絶対に出さず、存在可否のみ
  const vars = {
    CLOUDSQL_INSTANCE_CONNECTION_NAME: !!process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME,
    CLOUDSQL_DATABASE: !!process.env.CLOUDSQL_DATABASE,
    CLOUDSQL_USER: !!process.env.CLOUDSQL_USER,
    CLOUDSQL_PASSWORD: !!process.env.CLOUDSQL_PASSWORD,
    // Google サービスアカウント（Sheets/Cloud SQL Connector 認証用）
    GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY_PRESENT:
      typeof process.env.GOOGLE_PRIVATE_KEY === "string" && process.env.GOOGLE_PRIVATE_KEY.length > 0,
    // Square / メール等は必要に応じて増減
    NEXT_PUBLIC_SQUARE_APP_ID: !!process.env.NEXT_PUBLIC_SQUARE_APP_ID,
    NEXT_PUBLIC_SQUARE_LOCATION_ID: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    SQUARE_ACCESS_TOKEN: !!process.env.SQUARE_ACCESS_TOKEN,
  }

  return NextResponse.json(
    {
      ok: true,
      runtime: "node",
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      vars,
      note: "This endpoint only returns booleans. No secret values are exposed. Remove or protect this route after verification.",
    },
    { status: 200 },
  )
}