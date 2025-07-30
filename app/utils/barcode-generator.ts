// Code128バーコード生成ユーティリティ

interface Code128Pattern {
  [key: string]: string
}

// Code128-B エンコーディングテーブル
const CODE128B_PATTERNS: Code128Pattern = {
  " ": "11011001100",
  "!": "11001101100",
  '"': "11001100110",
  "#": "10010011000",
  $: "10010001100",
  "%": "10001001100",
  "&": "10011001000",
  "'": "10011000100",
  "(": "10001100100",
  ")": "11001001000",
  "*": "11001000100",
  "+": "11000100100",
  ",": "10110011100",
  "-": "10011011100",
  ".": "10011001110",
  "/": "10111001100",
  "0": "10011101100",
  "1": "10011100110",
  "2": "11001110010",
  "3": "11001011100",
  "4": "11001001110",
  "5": "11011100100",
  "6": "11001110100",
  "7": "11101101110",
  "8": "11101001100",
  "9": "11100101100",
  ":": "11100100110",
  ";": "11101100100",
  "<": "11100110100",
  "=": "11100110010",
  ">": "11011011000",
  "?": "11011000110",
  "@": "11000110110",
  A: "10100011000",
  B: "10001011000",
  C: "10001000110",
  D: "10110001000",
  E: "10001101000",
  F: "10001100010",
  G: "11010001000",
  H: "11000101000",
  I: "11000100010",
  J: "10110111000",
  K: "10110001110",
  L: "10001101110",
  M: "10111011000",
  N: "10111000110",
  O: "10001110110",
  P: "11101110110",
  Q: "11010001110",
  R: "11000101110",
  S: "11011101000",
  T: "11011100010",
  U: "11011101110",
  V: "11101011000",
  W: "11101000110",
  X: "11100010110",
  Y: "11101101000",
  Z: "11101100010",
}

const START_B = "11010010000"
const STOP = "1100011101011"

export function generateCode128Barcode(data: string): string {
  // Code128バーコードのパターンテーブル（簡略版）
  const code128Patterns: { [key: string]: string } = {
    "0": "11011001100",
    "1": "11001101100",
    "2": "11001100110",
    "3": "10010011000",
    "4": "10010001100",
    "5": "10001001100",
    "6": "10011001000",
    "7": "10011000100",
    "8": "10001100100",
    "9": "11001001000",
    // ... 他のパターンも必要に応じて追加
  }

  let barcode = ""

  // スタートコード（Code128-B）
  barcode += START_B

  // データ部分
  for (const char of data) {
    if (code128Patterns[char]) {
      barcode += code128Patterns[char]
    }
  }

  // チェックサム計算（簡略版）
  const checksum = calculateChecksum(data)
  barcode += code128Patterns[checksum.toString()]

  // ストップコード
  barcode += STOP

  return barcode
}

function calculateChecksum(data: string): number {
  // Code128チェックサム計算（簡略版）
  let sum = 104 // Code128-Bのスタート値

  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) - 32
    sum += charCode * (i + 1)
  }

  return sum % 103
}

export function generateBarcodeImage(data: string, width = 300, height = 60): string {
  // SVG形式でバーコード画像を生成
  const barcodePattern = generateCode128Barcode(data)
  const barWidth = width / barcodePattern.length

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`

  for (let i = 0; i < barcodePattern.length; i++) {
    if (barcodePattern[i] === "1") {
      const x = i * barWidth
      svg += `<rect x="${x}" y="0" width="${barWidth}" height="${height * 0.8}" fill="black"/>`
    }
  }

  // テキスト表示
  svg += `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-family="monospace" font-size="12">${data}</text>`
  svg += "</svg>"

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

function generateCode128Pattern(data: string): string {
  let pattern = START_B
  let checksum = 104 // Start B value

  for (let i = 0; i < data.length; i++) {
    const char = data[i]
    const charPattern = CODE128B_PATTERNS[char]

    if (!charPattern) {
      throw new Error(`Unsupported character: ${char}`)
    }

    pattern += charPattern

    // Calculate checksum
    const charValue = char.charCodeAt(0) - 32
    checksum += charValue * (i + 1)
  }

  // Add checksum
  const checksumValue = checksum % 103
  const checksumChar = String.fromCharCode(checksumValue + 32)
  pattern += CODE128B_PATTERNS[checksumChar] || CODE128B_PATTERNS["0"]

  // Add stop pattern
  pattern += STOP

  return pattern
}

export function generateCode128SVG(data: string, width = 200, height = 50): string {
  const barcodeData = generateCode128Pattern(data)
  const barWidth = width / barcodeData.length

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${width}" height="${height}" fill="white"/>`

  let x = 0
  for (const bit of barcodeData) {
    if (bit === "1") {
      svg += `<rect x="${x}" y="0" width="${barWidth}" height="${height * 0.8}" fill="black"/>`
    }
    x += barWidth
  }

  // テキスト表示
  svg += `<text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="8" fill="black">${data}</text>`
  svg += "</svg>"

  return svg
}

export function generateCode128Base64(data: string, width = 200, height = 50): string {
  const svg = generateCode128SVG(data, width, height)
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}
