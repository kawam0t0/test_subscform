import { SubscriptionForm } from "../components/SubscriptionForm"
import { SubscriptionList } from "../components/SubscriptionList"

export default function SubscriptionsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">サブスクリプション管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SubscriptionForm />
          </div>
          <div>
            <SubscriptionList />
          </div>
        </div>
      </div>
    </main>
  )
}
