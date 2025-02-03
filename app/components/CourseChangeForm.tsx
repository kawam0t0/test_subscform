"use client"

import { ArrowDown } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react" // Added import for React

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

export function CourseChangeForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.currentCourse || !formData.newCourse) {
      alert("現在のコースと新しいコースを選択してください")
      return
    }
    nextStep()
  }

  const filteredCourses = limitedCourseStores.includes(formData.store)
    ? courses.filter((course) => ["980", "1280"].includes(course.id))
    : courses

  const formatCourseOption = (course: (typeof courses)[0]) => `${course.name}（月額${course.price}）`

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="space-y-12">
        <div className="space-y-4">
          <label htmlFor="currentCourse" className="text-xl font-bold block">
            現ご利用コース
          </label>
          <select
            id="currentCourse"
            value={formData.currentCourse}
            onChange={(e) => updateFormData({ currentCourse: e.target.value })}
            required
            className="w-full h-16 px-4 rounded-xl border-2 border-gray-200 bg-white text-lg appearance-none cursor-pointer"
          >
            <option value="">選択してください</option>
            {filteredCourses.map((course) => (
              <option key={course.id} value={formatCourseOption(course)}>
                {formatCourseOption(course)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center py-6">
          <ArrowDown className="w-12 h-12 text-primary" />
        </div>

        <div className="space-y-4">
          <label htmlFor="newCourse" className="text-xl font-bold block">
            新ご利用コース
          </label>
          <select
            id="newCourse"
            value={formData.newCourse}
            onChange={(e) => updateFormData({ newCourse: e.target.value })}
            required
            className="w-full h-16 px-4 rounded-xl border-2 border-gray-200 bg-white text-lg appearance-none cursor-pointer"
          >
            <option value="">選択してください</option>
            {filteredCourses.map((course) => (
              <option key={course.id} value={formatCourseOption(course)}>
                {formatCourseOption(course)}
              </option>
            ))}
          </select>
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

