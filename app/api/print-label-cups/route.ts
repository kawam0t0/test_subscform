import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

interface LabelData {
  customerName: string
  carModel: string
  carColor: string
  referenceId: string
}

export async function POST(request: Request) {
  try {
    const labelData: LabelData = await request.json()

    // PostScriptファイルを生成
    const psFilePath = await generatePostScriptLabel(labelData)

    // CUPSを使用してプリンターに送信
    await printWithCUPS(psFilePath)

    // 一時ファイルを削除
    await fs.unlink(psFilePath)

    return NextResponse.json({
      success: true,
      message: "ラベルが正常に印刷されました",
    })
  } catch (error) {
    console.error("印刷エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "印刷に失敗しました",
      },
      { status: 500 },
    )
  }
}

async function generatePostScriptLabel(labelData: LabelData): Promise<string> {
  // PostScript形式でラベルを生成（24mm幅ラベル用）
  const postScript = `%!PS-Adobe-3.0
%%BoundingBox: 0 0 68 170
%%PageSize: 24mm 60mm

/Times-Bold findfont 8 scalefont setfont

% 顧客名を印刷
10 150 moveto
(${labelData.customerName}) show

% 車両情報を印刷
/Times-Roman findfont 6 scalefont setfont
10 135 moveto
(${labelData.carModel} / ${labelData.carColor}) show

% Code128バーコードを生成
/Code128 {
  /barcode exch def
  /x 10 def
  /y 100 def
  /height 20 def
  /width 1 def
  
  % バーコードパターンを描画（簡略版）
  barcode length {
    x y moveto
    x y height add lineto
    width setlinewidth
    stroke
    /x x width 2 mul add def
  } repeat
} def

(${labelData.referenceId}) Code128

% リファレンスIDテキスト
/Courier findfont 4 scalefont setfont
10 80 moveto
(${labelData.referenceId}) show

showpage
%%EOF`

  const tempDir = path.join(process.cwd(), "temp")
  await fs.mkdir(tempDir, { recursive: true })

  const psFilePath = path.join(tempDir, `label_${Date.now()}.ps`)
  await fs.writeFile(psFilePath, postScript, "utf-8")

  return psFilePath
}

async function printWithCUPS(psFilePath: string): Promise<void> {
  try {
    // Brother P950NWのプリンター名を確認
    const { stdout: printers } = await execAsync("lpstat -p")
    console.log("利用可能なプリンター:", printers)

    // Brother P950NWに印刷（プリンター名は環境に応じて調整）
    const printerName = "Brother_P950NW" // 実際のプリンター名に変更
    const command = `lp -d ${printerName} -o media=Custom.24x60mm "${psFilePath}"`

    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error("CUPS stderr:", stderr)
    }

    console.log("CUPS stdout:", stdout)
  } catch (error) {
    console.error("CUPS印刷エラー:", error)
    throw new Error("プリンター印刷に失敗しました")
  }
}
