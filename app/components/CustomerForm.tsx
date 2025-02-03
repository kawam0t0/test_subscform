import { useState } from "react"

// submitForm関数を更新
const submitForm = async () => {
  const [error, setError] = useState<string | null>(null) // Added state for error
  try {
    setError(null)

    // 入会の場合のみコースの選択を必須とする
    if (formData.operation === "入会" && !formData.course) {
      setError("コースを選択してください")
      return
    }

    const response = await fetch("/api/create-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || `エラーが発生しました: ${response.status}`)
    }

    if (data.success) {
      setStep(7)
    } else {
      throw new Error(data.error || "登録に失敗しました")
    }
  } catch (error) {
    console.error("フォーム送信エラー:", error)
    setError(error instanceof Error ? error.message : "エラーが発生しました")
  }
}