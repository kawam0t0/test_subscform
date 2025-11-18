"use client"

import { useState } from "react"
import { Check, Key } from "lucide-react"
import type { BaseFormProps } from "../types"
import type React from "react"

const courses = [
  {
    id: "980",
    name: "プレミアムスタンダード",
    price: "980円",
  },
  {
    id: "1280",
    name: "コーティングプラス",
    price: "1280円",
  },
  {
    id: "1480",
    name: "スーパーシャンプーナイアガラ",
    price: "1480円",
  },
  {
    id: "2980",
    name: "セラミックコーティングタートルシェル",
    price: "2980円",
  },
]

export function CourseChangeForm({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [referenceId, setReferenceId] = useState<string>(formData.referenceId || "")
  const [newCourse, setNewCourse] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!referenceId || referenceId.trim() === "") {
      setError("リファレンスIDを入力してください")
      return
    }

    if (!newCourse) {
      setError("新しいコースを選択してください")
      return
    }

    updateFormData({
      referenceId: referenceId.trim(),
      newCourse,
    })
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <label htmlFor="referenceId" className="form-label flex items-center gap-2">
          <Key className="h-6 w-6" />
          リファレンスID
        </label>
        <input
          id="referenceId"
          type="text"
          placeholder="リファレンスIDを入力してください"
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          required
          className="form-input"
        />
        <p className="text-sm text-gray-600">
          ※ 入会時にお送りしたメールに記載されているリファレンスIDを入力してください
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">新しいコースを選択</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`relative overflow-hidden rounded-xl shadow-md transition-all duration-300 ${
                newCourse === course.name
                  ? "border-4 border-primary bg-primary/5"
                  : "border border-gray-200 hover:border-primary/50"
              }`}
              onClick={() => setNewCourse(course.name)}
            >
              <div className="p-6 cursor-pointer flex flex-col items-center justify-center h-full">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">{course.name}</h4>
                <p className="text-2xl font-bold text-primary">月額{course.price}</p>
              </div>
              {newCourse === course.name && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 grid grid-cols-2 gap-3">
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

export default CourseChangeForm
