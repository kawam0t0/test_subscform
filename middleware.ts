import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // 環境変数が設定されているか確認
  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

  console.log("Middleware - Environment variables:", { appId, locationId })

  return NextResponse.next()
}