"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react"

const courses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    price: "980円",
    features: ["ボディ洗浄", "水垢除去", "タイヤ洗浄"],
  },
  {
    id: "1280",
    name: "コーティングプラス",
    price: "1280円",
    features: ["ボディ洗浄", "水垢除去", "タイヤ洗浄", "ワックス塗布"],
  },
  {
    id: "1480",
    name: "スーパーシャンプーナイアガラ",
    price: "1480円",
    features: ["ボディ洗浄", "水垢除去", "タイヤ洗浄", "ワックス塗布", "ホイールクリーニング"],
  },
  {
    id: "2980",
    name: "セラミックコーティングタートルシェル",
    price: "2980円",
    features: [
      "ボディ洗浄",
      "水垢除去",
      "タイヤ洗浄",
      "ワックス塗布",
      "ホイールクリーニング",
      "セラミックコーティング",
    ],
  },
]

export function CourseChangeForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [currentCourse, setCurrentCourse] = useState<string | null>(null)
  const [newCourse, setNewCourse] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCourse || !newCourse) {
      alert("現在のコースと新しいコースを選択してください")
      return
    }
    updateFormData({ currentCourse, newCourse })
    nextStep()
  }

  const renderCourseSelection = (
    title: string,
    selectedCourse: string | null,
    setSelectedCourse: (course: string) => void,
  ) => (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`relative overflow-hidden rounded-xl shadow-md transition-all duration-300 ${
              selectedCourse === course.name
                ? "border-4 border-primary bg-primary/5"
                : "border border-gray-200 hover:border-primary/50"
            }`}
            onClick={() => setSelectedCourse(course.name)}
          >
            <div className="p-4 cursor-pointer">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{course.name}</h4>
              <p className="text-2xl font-bold text-primary mb-3">月額{course.price}</p>
              <ul className="space-y-1 text-sm">
                {course.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {selectedCourse === course.name && (
              <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderCourseSelection("現ご利用コース", currentCourse, setCurrentCourse)}

      <div className="flex justify-center py-4">
        <ChevronDown className="w-16 h-16 text-primary animate-bounce" strokeWidth={3} />
      </div>

      {renderCourseSelection("新ご利用コース", newCourse, setNewCourse)}

      <div className="flex justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={prevStep}
          className="px-8 h-14 rounded-xl border-2 border-primary text-primary bg-white
                   hover:bg-primary/5 transition-colors duration-200"
        >
          戻る
        </button>
        <button
          type="submit"
          className="px-8 h-14 rounded-xl bg-primary text-white
                   hover:bg-primary/90 transition-colors duration-200"
        >
          次へ
        </button>
      </div>
    </form>
  )
}

