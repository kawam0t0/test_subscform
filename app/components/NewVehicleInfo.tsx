"use client"

import type React from "react"
import { useState } from "react"
import { Car, Palette } from "lucide-react"
import type { BaseFormProps } from "../types"

const carColors = ["白系", "黒系", "赤系", "青系", "黄系", "紫系", "緑系", "茶系", "紺系", "グレー系", "シルバー系"]

export function NewVehicleInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [carModelError, setCarModelError] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 車種の全角カタカナバリデーション
    if (!/^[ァ-ヶー　]+$/.test(formData.newCarModel)) {
      setCarModelError("車種は全角カタカナで入力してください。")
      return
    }

    nextStep()
  }

  const handleCarModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ newCarModel: e.target.value })
    setCarModelError("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 form-container">
      <div>
        <label htmlFor="newCarModel" className="form-label flex items-center gap-2">
          <Car className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          新しい車種
          <span className="text-sm md:text-base lg:text-lg font-normal text-gray-500 ml-2">
            (全角カタカナで入力してください)
          </span>
        </label>
        <input
          id="newCarModel"
          type="text"
          value={formData.newCarModel}
          onChange={handleCarModelChange}
          required
          className="form-input"
          placeholder="例：タント、プリウス"
        />
        {carModelError && <p className="text-red-500 text-sm mt-2">{carModelError}</p>}
      </div>

      <div>
        <label htmlFor="newCarColor" className="select-label">
          <Palette className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          新しい車の色
        </label>
        <div className="select-wrapper min-w-[280px]">
          <select
            id="newCarColor"
            value={formData.newCarColor}
            onChange={(e) => updateFormData({ newCarColor: e.target.value })}
            required
            className="custom-select"
          >
            <option value="">選択してください</option>
            {carColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
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
