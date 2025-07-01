"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

// 店舗情報
const locations = [
  { id: "L49BHVHTKTQPE", name: "SPLASH'N'GO!前橋50号店" },
  { id: "LEFYQ66VK7C0H", name: "SPLASH'N'GO!伊勢崎韮塚店" },
  { id: "LDHMQX9VPW34B", name: "SPLASH'N'GO!高崎棟高店" },
  { id: "LV19VY3VYHPBA", name: "SPLASH'N'GO!足利緑町店" },
  { id: "LPK3Z9BHEEXX3", name: "SPLASH'N'GO!新前橋店" },
]

// 料金プラン
const plans = [
  { id: "PREM_STD", name: "プレミアムスタンダード", price: 980 },
  { id: "COATING_PLUS", name: "コーティングプラス", price: 1280 },
  { id: "SUPER_NIAGARA", name: "スーパーシャンプーナイアガラ", price: 1480 },
  { id: "CERAMIC_TURTLE", name: "セラミックコーティングタートルシェル", price: 2980 },
]

export function SubscriptionForm() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState("")
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // サブスクリプションを作成
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          planId: selectedPlanId,
          locationId: selectedLocationId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "サブスクリプションの作成に失敗しました")
      }

      setSuccess(`サブスクリプションが正常に作成されました。ID: ${data.subscriptionId}`)
      // フォームをリセット
      setCustomerId("")
      setSelectedLocationId("")
      setSelectedPlanId("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">サブスクリプション登録</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
            顧客ID
          </label>
          <input
            id="customerId"
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: CUST_12345"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            店舗
          </label>
          <select
            id="location"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">店舗を選択してください</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
            プラン
          </label>
          <select
            id="plan"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">プランを選択してください</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - 月額{plan.price}円
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "処理中..." : "サブスクリプションを作成"}
        </button>
      </form>
    </div>
  )
}
