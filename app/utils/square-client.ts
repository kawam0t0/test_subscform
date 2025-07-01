import { Client, Environment } from "square"

// Square APIクライアントのシングルトンインスタンス
let squareClient: Client | null = null

export function getSquareClient(): Client {
  if (!squareClient) {
    squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production, // 本番環境の場合
    })
  }
  return squareClient
}
