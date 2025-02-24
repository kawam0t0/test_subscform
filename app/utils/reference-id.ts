export function generateReferenceId(store: string): string {
  const storePrefix =
    {
      "SPLASH'N'GO!前橋50号店": "1001",
      "SPLASH'N'GO!伊勢崎韮塚店": "1002",
      "SPLASH'N'GO!高崎棟高店": "1003",
      "SPLASH'N'GO!足利緑町店": "1004",
      "SPLASH'N'GO!新前橋店": "1005",
    }[store] || "1000"

  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0")

  return `${storePrefix}${randomPart}`
}

  