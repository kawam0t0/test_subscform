"use client"

import React, { useState } from "react"
import type { BaseFormProps } from "../types"

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

  const filteredCourses = limitedCourseStores.includes(formData.store)
    ? courses.filter((course) => ["980", "1280"].includes(course.id))
    : courses

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div>
        <h2 className="text-2xl font-semibold mb-8">コースを選択してください</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const isSelected = formData.course === `${course.name}（月額${course.price}）`

            return (
              <button
                key={course.id}
                type="button"
                className={`course-card ${isSelected ? "selected" : ""}`}
                onClick={() => updateFormData({ course: `${course.name}（月額${course.price}）` })}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
              >
                <div className="text-center space-y-4 w-full">
                  <div className={`font-medium text-xl leading-tight ${isSelected ? "text-primary" : "text-gray-700"}`}>
                    {course.displayName.map((part, index) => (
                      <React.Fragment key={index}>
                        {part}
                        {index < course.displayName.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className={`text-3xl font-bold ${isSelected ? "text-primary" : "text-primary/80"}`}>
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

