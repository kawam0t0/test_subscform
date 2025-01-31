"use client"

import React from "react"
import { useState } from "react"
import type { BaseFormProps } from "../types"

// コースの定義を更新
const courses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    displayName: ["プレミアム", "スタンダード"],
    price: "980円",
  },
  {
    id: "1280",
    name: "コーティングプラス",
    displayName: ["コーティング", "プラス"],
    price: "1280円",
  },
  {
    id: "1480",
    name: "スーパーシャンプーナイアガラ",
    displayName: ["スーパー", "シャンプー", "ナイアガラ"],
    price: "1480円",
  },
  {
    id: "2980",
    name: "セラミックコーティングタートルシェル",
    displayName: ["セラミック", "コーティング", "タートルシェル"],
    price: "2980円",
  },
]

// 限定コースを提供する店舗のリスト
const limitedCourseStores = ["SPLASH'N'GO!前橋50号店", "SPLASH'N'GO!伊勢崎韮塚店", "SPLASH'N'GO!足利緑町店"]

export function CourseSelection({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.course) {
      alert("コースを選択してください")
      return
    }
    nextStep()
  }

  // 店舗に基づいて表示するコースをフィルタリング
  const filteredCourses = limitedCourseStores.includes(formData.store)
    ? courses.filter((course) => ["980", "1280"].includes(course.id))
    : courses

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="form-label text-base mb-4">コースを選択してください</label>
        <div className="grid grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            const isSelected = formData.course === `${course.name}（月額${course.price}）`

            return (
              <button
                key={course.id}
                type="button"
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-between min-h-[160px] ${
                  isSelected
                    ? "border-primary bg-white shadow-lg"
                    : "border-gray-200 hover:border-primary/50 hover:shadow-md"
                }`}
                onClick={() => updateFormData({ course: `${course.name}（月額${course.price}）` })}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
              >
                <div className="text-center space-y-3 w-full">
                  <div className={`font-medium text-sm leading-tight ${isSelected ? "text-primary" : "text-gray-700"}`}>
                    {course.displayName.map((part, index) => (
                      <React.Fragment key={index}>
                        {part}
                        {index < course.displayName.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className={`text-xl font-bold ${isSelected ? "text-primary" : "text-primary/80"}`}>
                    月額{course.price}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div className="pt-4 flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-secondary px-8">
          戻る
        </button>
        <button type="submit" className="btn btn-primary px-8">
          次へ
        </button>
      </div>
    </form>
  )
}

