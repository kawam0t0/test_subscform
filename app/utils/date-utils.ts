export function formatJapanDateTime(date: Date): string {
    const japanTime = new Date(date.getTime() + 9 * 60 * 60 * 1000) // UTC to JST
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
  