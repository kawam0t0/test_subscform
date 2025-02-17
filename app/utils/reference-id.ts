export function generateReferenceId(store: string): string {
    const storePrefix =
      {
        "SPLASH'N'GO!前橋50号店": "001",
        "SPLASH'N'GO!伊勢崎韮塚店": "002",
        "SPLASH'N'GO!高崎棟高店": "003",
        "SPLASH'N'GO!足利緑町店": "004",
      }[store] || "000"
  
    const randomPart = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")
  
    return `${storePrefix}${randomPart}`
  }
  