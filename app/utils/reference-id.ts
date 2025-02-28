function generateShortUniqueId(storeCode: string): string {
  // 現在のタイムスタンプを取得（ミリ秒単位）
  const timestamp = Date.now().toString()

  // タイムスタンプをハッシュ化
  let hash = 0
  for (let i = 0; i < timestamp.length; i++) {
    const char = timestamp.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // ハッシュを正の9桁の数値に変換
  const positiveHash = Math.abs(hash)
  const nineDigitHash = positiveHash % 1000000000

  // 店舗コードとハッシュを組み合わせて13桁のIDを生成
  return `${storeCode}${nineDigitHash.toString().padStart(9, "0")}`
}

export function generateReferenceId(store: string): string {
  const storePrefix =
    {
      "SPLASH'N'GO!前橋50号店": "1001",
      "SPLASH'N'GO!伊勢崎韮塚店": "1002",
      "SPLASH'N'GO!高崎棟高店": "1003",
      "SPLASH'N'GO!足利緑町店": "1004",
      "SPLASH'N'GO!新前橋店": "1005",
    }[store] || "1000"

  return generateShortUniqueId(storePrefix)
}

