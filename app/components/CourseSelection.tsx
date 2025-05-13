"use client"

import { useState } from "react"
import { Check, Tag } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react"

const allCourses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    price: "980円",
    campaignPrice: "39円",
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
    campaignPrice: "339円",
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
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 inline-block mx-auto">
          <p className="text-yellow-800 font-medium">
            <span className="text-red-600 font-bold">4/1〜5/30</span>までの新規お申し込みに限り
            <span className="text-red-600 font-bold">初月特別価格</span>でご提供！
          </p>
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
            <div className="absolute top-0 left-0 w-full h-full bg-yellow-400 opacity-10 pointer-events-none"></div>

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
                <div className="text-lg text-gray-500 line-through">月額{course.price}</div>
                <div className="flex items-center mt-2">
                  <Tag className="w-5 h-5 text-red-600 mr-1" />
                  <span className="text-sm font-medium text-red-600">期間限定</span>
                </div>
                <div className="text-3xl font-bold text-red-600 mt-1">初月 {course.campaignPrice}</div>
                <div className="text-sm text-gray-600 mt-1 bg-yellow-100 px-2 py-1 rounded">2ヶ月目以降は通常料金</div>
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
