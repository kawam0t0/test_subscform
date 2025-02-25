export function formatJapanDateTime(date: Date): string {
  // 日本時間に変換（UTCから9時間進める）
  const japanTime = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return japanTime
    .toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/[/]/g, "/")
    .replace(/,/g, "")
}
  