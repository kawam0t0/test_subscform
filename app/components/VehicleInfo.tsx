"use client"

import type React from "react"
import { useState } from "react"
import { Car, Palette } from "lucide-react"
import type { BaseFormProps } from "../types"

const topCarModels = [
  "カローラ",
  "プリウス",
  "ノート",
  "フィット",
  "アクア",
  "スイフト",
  "タント",
  "ヤリス",
  "ステップワゴン",
  "シエンタ",
  "CX-5",
  "インプレッサ",
  "セレナ",
  "ヴォクシー",
  "ヴェゼル",
  "ワゴンR",
  "ハリアー",
  "デイズ",
  "N-BOX",
  "ライズ",
]

const carColors = ["白系", "黒系", "赤系", "青系", "黄系", "紫系", "緑系", "茶系", "紺系", "グレー系", "シルバー系"]

export function VehicleInfo({ formData, updateFormData, nextStep, prevStep }: BaseFormProps) {
  const [isCustomModel, setIsCustomModel] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const handleCarModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === "その他") {
      setIsCustomModel(true)
      updateFormData({ carModel: "" })
    } else {
      setIsCustomModel(false)
      updateFormData({ carModel: value })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="carModel" className="flex items-center gap-2 form-label">
          <Car />
          車種
        </label>
        <select
          id="carModel"
          value={isCustomModel ? "その他" : formData.carModel}
          onChange={handleCarModelChange}
          required
          className="form-input"
        >
          <option value="">選択してください</option>
          {topCarModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
          <option value="その他">その他</option>
        </select>
      </div>
      {isCustomModel && (
        <div>
          <label htmlFor="customCarModel" className="form-label">
            その他の車種
          </label>
          <input
            id="customCarModel"
            type="text"
            value={formData.carModel}
            onChange={(e) => updateFormData({ carModel: e.target.value })}
            required
            className="form-input"
            placeholder="車種を入力してください"
          />
        </div>
      )}
      <div>
        <label htmlFor="carColor" className="flex items-center gap-2 form-label">
          <Palette />
          車の色
        </label>
        <select
          id="carColor"
          value={formData.carColor}
          onChange={(e) => updateFormData({ carColor: e.target.value })}
          required
          className="form-input"
        >
          <option value="">選択してください</option>
          {carColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>
      <div className="pt-4 flex justify-between">
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

