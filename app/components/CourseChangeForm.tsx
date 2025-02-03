"use client"

import { ChevronDown } from "lucide-react"
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
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">現ご利用コース</h3>
          <div className="relative">
            <select
              id="currentCourse"
              value={formData.currentCourse}
              onChange={(e) => updateFormData({ currentCourse: e.target.value })}
              required
              className="w-full h-16 px-6 text-lg rounded-2xl border-2 border-gray-200 bg-white
                       shadow-sm transition-all duration-200
                       hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10
                       appearance-none cursor-pointer"
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

        <div className="flex justify-center py-2">
          <ChevronDown className="w-24 h-24 text-primary animate-bounce" strokeWidth={3} />
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">新ご利用コース</h3>
          <div className="relative">
            <select
              id="newCourse"
              value={formData.newCourse}
              onChange={(e) => updateFormData({ newCourse: e.target.value })}
              required
              className="w-full h-16 px-6 text-lg rounded-2xl border-2 border-gray-200 bg-white
                       shadow-sm transition-all duration-200
                       hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10
                       appearance-none cursor-pointer"
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
      </div>

      <div className="flex justify-end gap-4 mt-12">
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

