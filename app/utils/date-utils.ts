export function formatJapanDateTime(date: Date): string {
  // UTC+9の変換を削除し、そのままのDateオブジェクトを使用
  return date
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