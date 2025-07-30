"use client"

import { useState } from "react"
import { Check, Gift, Star } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react"

const allCourses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    price: "980円",
  },
  {
    id: "1280",
    name: "コーティングプラス",
    price: "1280円",
  },
  {
    id: "1480",
    name: "スーパーシャンプーナイアガラ",
    price: "1480円",
  },
  {
    id: "2980",
    name: ["セラミックコーティングタートル", "シェル"],
    price: "2980円",
  },
]

// 制限付き商品を提供する店舗
const limitedStores = ["SPLASH'N'GO!前橋50号店", "SPLASH'N'GO!伊勢崎韮塚店", "SPLASH'N'GO!足利緑町店"]

export function CourseSelection({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  // キャンペーン適用チェック
  const isCampaignApplied = () => {
    return (
      formData.operation === "入会" && formData.store === "SPLASH'N'GO!新前橋店" && formData.campaignCode === "SPGO418"
    )
  }

  // 店舗に基づいてコースをフィルタリング
  const courses = limitedStores.includes(formData.store)
    ? allCourses.filter((course) => ["980", "1280"].includes(course.id))
    : allCourses

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCourse) {
      updateFormData({ course: selectedCourse })
      nextStep()
    } else {
      alert("コースを選択してください")
    }
  }

  // キャンペーン適用時の特別表示
  if (isCampaignApplied()) {
    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-6 rounded-2xl mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-8 h-8" />
              <h2 className="text-3xl font-bold">キャンペーン適用中！</h2>
            </div>
            <p className="text-lg">プレミアムスタンダードが2ヶ月無料でご利用いただけます！</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div
            className="relative overflow-hidden rounded-2xl shadow-xl border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => setSelectedCourse("プレミアムスタンダード（キャンペーン）")}
          >
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-gray-800">プレミアムスタンダード</h3>
              </div>
              <div className="space-y-2">
                <div className="text-lg text-gray-500 line-through">通常価格：月額980円</div>
                <div className="text-3xl font-bold text-red-600">最初の2ヶ月：無料！</div>
                <div className="text-lg text-gray-700">3ヶ月目以降：月額980円</div>
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-yellow-300">
                <p className="text-sm text-gray-600">
                 キャンペーンコード「SPGO418」が適用されました
                  <br />2ヶ月間無料でお試しいただけます
                </p>
              </div>
            </div>
            {selectedCourse === "プレミアムスタンダード（キャンペーン）" && (
              <div className="absolute top-4 left-4 bg-green-500 text-white rounded-full p-2">
                <Check className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button type="button" onClick={prevStep} className="btn btn-secondary">
            戻る
          </button>
          <button
            type="submit"
            className="btn btn-primary bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            disabled={!selectedCourse}
          >
            キャンペーンで申し込む
          </button>
        </div>
      </form>
    )
  }

  // 通常のコース選択画面
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">洗車コースを選択</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${
              selectedCourse === (Array.isArray(course.name) ? course.name.join("") : course.name)
                ? "border-4 border-primary bg-primary/5"
                : "border border-gray-200 hover:border-primary/50"
            }`}
            onClick={() => setSelectedCourse(Array.isArray(course.name) ? course.name.join("") : course.name)}
          >
            <div className="p-6 cursor-pointer flex flex-col items-center justify-center h-full">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                {Array.isArray(course.name) ? (
                  <>
                    {course.name[0]}
                    <br />
                    {course.name[1]}
                  </>
                ) : (
                  course.name
                )}
              </h3>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">月額{course.price}</div>
              </div>
            </div>
            {selectedCourse === (Array.isArray(course.name) ? course.name.join("") : course.name) && (
              <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-2">
                <Check className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          戻る
        </button>
        <button type="submit" className="btn btn-primary">
          次へ
        </button>
      </div>
    </form>
  )
}
