export function formatJapanDateTime(date: Date): string {
  // 日本時間に変換（UTC+9）
  const japanTime = new Date(date.getTime() + 9 * 60 * 60 * 1000)

  // 日本時間のフォーマット
  const year = japanTime.getUTCFullYear()
  const month = String(japanTime.getUTCMonth() + 1).padStart(2, "0")
  const day = String(japanTime.getUTCDate()).padStart(2, "0")
  const hours = String(japanTime.getUTCHours()).padStart(2, "0")
  const minutes = String(japanTime.getUTCMinutes()).padStart(2, "0")
  const seconds = String(japanTime.getUTCSeconds()).padStart(2, "0")

  // YYYY/MM/DD HH:MM:SS 形式で返す
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}
