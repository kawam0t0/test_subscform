"use client"

import { useState } from "react"
import type { BaseFormProps } from "../types"
import type React from "react"

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`course-card ${selectedCourse === course.name ? "selected" : ""}`}
            onClick={() => setSelectedCourse(course.name)}
          >
            <div className="text-center">
              {course.displayName.map((line, index) => (
                <div key={index} className={index === 0 ? "text-lg font-bold" : "text-base"}>
                  {line}
                </div>
              ))}
            </div>
            <div className="text-2xl font-bold text-primary mt-2">月額{course.price}</div>
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

