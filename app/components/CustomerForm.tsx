import { useState } from "react"

// ... other imports ...

const CustomerForm = () => {
  const [formData, setFormData] = useState({ operation: "入会" /* ... other form data ... */ })
  const [error, setError] = useState(null) // Added setError state
  const [step, setStep] = useState(1) // Assuming step state exists

  // ... other code ...

  const submitForm = async () => {
    try {
      setError(null)

      // ここで入会フローとその他のフローを分岐
      const endpoint = formData.operation === "入会" ? "/api/create-customer" : "/api/update-customer"

      console.log("送信先エンドポイント:", endpoint)
      console.log("送信データ:", formData)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `エラーが発生しました: ${response.status}`)
      }

      if (data.success) {
        setStep(7) // ThankYou ページへ
      } else {
        throw new Error(data.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("フォーム送信エラー:", error)
      setError(error instanceof Error ? error.message : "エラーが発生しました")
    }
  }

  // ... rest of code ...
}

export default CustomerForm

