"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react"

const allCourses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    regularPrice: "980円",
    campaignPrice: "139円", // Added campaign price
  },
  {
    id: "1280",
    name: "コーティングプラス",
    regularPrice: "1280円",
    campaignPrice: "139円", // Added campaign price
  },
  {
    id: "1480",
    name: "スーパーシャンプーナイアガラ",
    regularPrice: "1480円",
    campaignPrice: "339円", // Added campaign price
  },
  {
    id: "2980",
    name: ["セラミックコーティングタートル", "シェル"],
    regularPrice: "2980円",
    campaignPrice: "1939円", // Added campaign price
  },
]

const limitedStores = ["SPLASH'N'GO!前橋50号店", "SPLASH'N'GO!伊勢崎韮塚店", "SPLASH'N'GO!足利緑町店"]

export function CourseSelection({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const courses = limitedStores.includes(formData.store)
    ? allCourses.filter((course) => ["980", "1280"].includes(course.id))
    : allCourses

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCourse) {
      updateFormData({
        course: selectedCourse,
        enableSubscription: true, // 入会時は自動的にサブスクリプションを有効化
      })
      nextStep()
    } else {
      alert("コースを選択してください")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">洗車コースを選択</h2>
        <div className="mt-4 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-lg shadow-lg inline-block">
          <p className="text-lg font-bold">🎉 初月限定キャンペーン実施中！</p>
          <p className="text-sm mt-1">2ヶ月目以降は通常価格で自動課金されます</p>
        </div>
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
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              初月限定
            </div>

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
                <div className="text-sm text-gray-500 line-through mb-1">通常 月額{course.regularPrice}</div>
                <div className="text-3xl font-bold text-red-500 mb-1">初月 {course.campaignPrice}</div>
                <div className="text-xs text-gray-600 mt-2">2ヶ月目以降: 月額{course.regularPrice}</div>
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
