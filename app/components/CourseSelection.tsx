"use client"

import { useState } from "react"
import { Check } from "lucide-react"
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

export function CourseSelection({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

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
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">洗車コースを選択</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${
              selectedCourse === course.name
                ? "border-4 border-primary bg-primary/5"
                : "border border-gray-200 hover:border-primary/50"
            }`}
            onClick={() => setSelectedCourse(course.name)}
          >
            <div className="p-6 cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.name}</h3>
              <p className="text-3xl font-bold text-primary mb-4">月額{course.price}</p>
              <ul className="space-y-2">
                {course.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {selectedCourse === course.name && (
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

