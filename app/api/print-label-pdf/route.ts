import { NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import { generateCode128SVG } from "../../utils/barcode-generator"

interface LabelData {
  customerName: string
  carModel: string
  carColor: string
  referenceId: string
}

export async function POST(request: Request) {
  try {
    const labelData: LabelData = await request.json()

    // PDFを生成
    const pdfBuffer = await generateLabelPDF(labelData)

    // PDFを直接印刷
    await printPDFDirectly(pdfBuffer)

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

async function generateLabelPDF(labelData: LabelData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // 24mm x 60mm のラベルサイズ（ポイント単位）
      const doc = new PDFDocument({
        size: [68, 170], // 24mm x 60mm in points
        margins: { top: 5, bottom: 5, left: 5, right: 5 },
      })

      const chunks: Buffer[] = []
      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))

      // 顧客名
      doc.fontSize(8).font("Helvetica-Bold").text(labelData.customerName, 5, 10, {
        width: 58,
        align: "center",
      })

      // 車両情報
      doc.fontSize(6).font("Helvetica").text(`${labelData.carModel} / ${labelData.carColor}`, 5, 25, {
        width: 58,
        align: "center",
      })

      // Code128バーコード（SVGとして生成）
      const barcodeSVG = generateCode128SVG(labelData.referenceId, 50, 15)

      // バーコードを描画（簡易実装）
      doc.fontSize(4).font("Courier").text(labelData.referenceId, 5, 45, {
        width: 58,
        align: "center",
      })

      // バーコードバー（簡易表示）
      for (let i = 0; i < 20; i++) {
        const x = 5 + i * 2.5
        const height = i % 2 === 0 ? 12 : 8
        doc.rect(x, 55, 1, height).fill("black")
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

async function printPDFDirectly(pdfBuffer: Buffer): Promise<void> {
  const fs = await import("fs/promises")
  const { exec } = await import("child_process")
  const { promisify } = await import("util")
  const path = await import("path")

  const execAsync = promisify(exec)

  try {
    // 一時PDFファイルを作成
    const tempDir = path.join(process.cwd(), "temp")
    await fs.mkdir(tempDir, { recursive: true })

    const pdfPath = path.join(tempDir, `label_${Date.now()}.pdf`)
    await fs.writeFile(pdfPath, pdfBuffer)

    // PDFを印刷
    const printerName = "Brother_P950NW" // 実際のプリンター名に変更
    const command = `lp -d ${printerName} -o media=Custom.24x60mm -o fit-to-page "${pdfPath}"`

    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error("PDF印刷 stderr:", stderr)
    }

    console.log("PDF印刷 stdout:", stdout)

    // 一時ファイルを削除
    await fs.unlink(pdfPath)
  } catch (error) {
    console.error("PDF印刷エラー:", error)
    throw new Error("PDF印刷に失敗しました")
  }
}
