"use client"

import type React from "react"
import { useState } from "react"
import { Car, Palette, FileText } from "lucide-react"
import type { BaseFormProps } from "../types"

const carColors = ["白系", "黒系", "赤系", "青系", "黄系", "紫系", "緑系", "茶系", "紺系", "グレー系", "シルバー系"]

export function VehicleInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [carModelError, setCarModelError] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 車種の全角カタカナバリデーション
    if (!/^[ァ-ヶー　]+$/.test(formData.carModel)) {
      setCarModelError("車種は全角カタカナで入力してください。")
      return
    }

    nextStep()
  }

  const handleCarModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ carModel: e.target.value })
    setCarModelError("")
  }

  const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "").slice(0, 4)
    updateFormData({ licensePlate: value })
  }

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="form-grid">
        <div>
          <label htmlFor="carModel" className="form-label flex items-center gap-2">
            <Car className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
            車種
            <span className="text-sm md:text-base lg:text-lg font-normal text-gray-500 ml-2">
              (全角カタカナで入力してください)
            </span>
          </label>
          <input
            id="carModel"
            type="text"
            value={formData.carModel}
            onChange={handleCarModelChange}
            required
            className="form-input"
            placeholder="例：タント、プリウス"
          />
          {carModelError && <p className="text-red-500 text-sm mt-2">{carModelError}</p>}
        </div>

        <div>
          <label htmlFor="carColor" className="select-label">
            <Palette className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
            車の色
          </label>
          <div className="select-wrapper">
            <select
              id="carColor"
              value={formData.carColor}
              onChange={(e) => updateFormData({ carColor: e.target.value })}
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

        {formData.operation !== "入会" && (
          <div>
            <label htmlFor="licensePlate" className="form-label flex items-center gap-2">
              <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
              ナンバープレート（下4桁）
            </label>
            <p className="text-sm text-gray-500 mb-2">
              ＊4桁以外の方は合計で4桁になるよう0を加えて下さい（例：10➛0010）
            </p>
            <input
              id="licensePlate"
              type="text"
              value={formData.licensePlate || ""}
              onChange={handleLicensePlateChange}
              required
              className="form-input"
              placeholder="例：1234"
              maxLength={4}
              pattern="\d{4}"
            />
          </div>
        )}
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

