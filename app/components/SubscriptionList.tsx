"use client"

import { useState, useEffect } from "react"

// 店舗情報
const locations = [
  { id: "L49BHVHTKTQPE", name: "SPLASH'N'GO!前橋50号店" },
  { id: "LEFYQ66VK7C0H", name: "SPLASH'N'GO!伊勢崎韮塚店" },
  { id: "LDHMQX9VPW34B", name: "SPLASH'N'GO!高崎棟高店" },
  { id: "LV19VY3VYHPBA", name: "SPLASH'N'GO!足利緑町店" },
  { id: "LPK3Z9BHEEXX3", name: "SPLASH'N'GO!新前橋店" },
]

interface Subscription {
  id: string
  locationId: string
  planId: string
  customerId: string
  startDate: string
  status: string
}

export function SubscriptionList() {
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedLocationId) {
      fetchSubscriptions()
    }
  }, [selectedLocationId])

  const fetchSubscriptions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/list-subscriptions?locationId=${selectedLocationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "サブスクリプションの取得に失敗しました")
      }

      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました")
      setSubscriptions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async (subscriptionId: string, action: string) => {
    try {
      const response = await fetch("/api/manage-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          action,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "操作に失敗しました")
      }

      // 成功したら一覧を更新
      fetchSubscriptions()
    } catch (error) {
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">サブスクリプション一覧</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          店舗を選択
        </label>
        <select
          id="location"
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
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

      {isLoading ? (
        <div className="text-center py-4">
          <p>読み込み中...</p>
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  サブスクリプションID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顧客ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  開始日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscription.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscription.customerId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscription.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscription.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {subscription.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleManageSubscription(subscription.id, "pause")}
                          className="text-yellow-600 hover:text-yellow-900 mr-2"
                        >
                          一時停止
                        </button>
                        <button
                          onClick={() => handleManageSubscription(subscription.id, "cancel")}
                          className="text-red-600 hover:text-red-900"
                        >
                          キャンセル
                        </button>
                      </>
                    )}
                    {subscription.status === "PAUSED" && (
                      <button
                        onClick={() => handleManageSubscription(subscription.id, "resume")}
                        className="text-green-600 hover:text-green-900"
                      >
                        再開
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedLocationId ? (
        <div className="text-center py-4">
          <p>サブスクリプションが見つかりません</p>
        </div>
      ) : null}
    </div>
  )
}
