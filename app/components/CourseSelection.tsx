"use client"

import { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react"

const allCourses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    price: "980円",
    campaignPrice: "139円",
  },
  {
    id: "1280",
    name: "コーティングプラス",
    price: "1280円",
    campaignPrice: "139円",
  },
  {
    id: "1480",
    name: "スーパーシャンプーナイアガラ",
    price: "1480円",
    campaignPrice: "399円",
  },
  {
    id: "2980",
    name: ["セラミックコーティングタートル", "シェル"],
    price: "2980円",
    campaignPrice: "1939円",
  },
]

// 制限付き商品を提供する店舗
const limitedStores = ["SPLASH'N'GO!前橋50号店", "SPLASH'N'GO!伊勢崎韮塚店", "SPLASH'N'GO!足利緑町店"]

export function CourseSelection({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  // 店舗に基づいてコースをフィルタリング
  const courses = limitedStores.includes(formData.store)
    ? allCourses.filter((course) => ["980", "1280"].includes(course.id))
    : allCourses

  const isJoining = formData.operation === "入会"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCourse) {
      updateFormData({ course: selectedCourse })
      nextStep()
    } else {
      alert("コースを選択してください")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">洗車コースを選択</h2>
        {isJoining && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-full px-6 py-2">
            <span className="text-sm font-semibold text-yellow-800">10/1~11/30迄キャンペーン実施中!</span>
          </div>
        )}
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
            {isJoining && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                初月限定
              </div>
            )}

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
                {isJoining ? (
                  <>
                    <div className="text-lg text-gray-400 line-through mb-1">通常 月額{course.price}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-orange-600 font-semibold">初月</span>
                      <span className="text-4xl font-bold text-orange-600">{course.campaignPrice}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">2ヶ月目以降 月額{course.price}</div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-primary">月額{course.price}</div>
                )}
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
