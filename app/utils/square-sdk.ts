// Square Web Payments SDK の初期化とカード処理を行うユーティリティ

declare global {
  interface Window {
    Square?: {
      payments(appId: string): Promise<any>
    }
  }
}

export interface SquareCardResult {
  status: string
  token?: string
  errors?: Array<{ message: string }>
}

export class SquareSDK {
  private payments: any = null
  private card: any = null
  private appId: string

  constructor(appId: string) {
    this.appId = appId
  }

  async initialize(): Promise<void> {
    if (!window.Square) {
      throw new Error("Square SDK が読み込まれていません")
    }

    this.payments = await window.Square.payments(this.appId)
  }

  async attachCard(containerId: string): Promise<void> {
    if (!this.payments) {
      throw new Error("Square Payments が初期化されていません")
    }

    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`コンテナ ${containerId} が見つかりません`)
    }

    this.card = await this.payments.card({
      style: {
        input: {
          fontSize: "16px",
          color: "#374151",
          backgroundColor: "#ffffff",
        },
        "input::placeholder": {
          color: "#9CA3AF",
        },
        ".input-container": {
          borderColor: "#E5E7EB",
          borderWidth: "1px",
          borderRadius: "0.5rem",
          padding: "0.75rem",
        },
        ".input-container.is-focus": {
          borderColor: "#3B82F6",
          boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.25)",
        },
      },
    })

    await this.card.attach(container)
  }

  async tokenizeCard(): Promise<SquareCardResult> {
    if (!this.card) {
      throw new Error("カードが初期化されていません")
    }

    const result = await this.card.tokenize()
    return result
  }

  destroy(): void {
    if (this.card && typeof this.card.destroy === "function") {
      this.card.destroy()
      this.card = null
    }
  }
}

export async function loadSquareScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Square) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://web.squarecdn.com/v1/square.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Square SDK の読み込みに失敗しました"))
    document.head.appendChild(script)
  })
}
