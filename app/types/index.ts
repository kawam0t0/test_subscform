import type React from "react"
export interface FormData {
  operation: string
  store: string
  familyName: string
  givenName: string
  email: string
  phone: string
  carModel: string
  carColor: string
  licensePlate: string
  cardToken: string
  referenceId: string
  course: string
  newCarModel: string
  newCarColor: string
  newLicensePlate: string
  currentCourse: string
  newCourse: string
  inquiryDetails?: string
  inquiryType?: string // プルダウンの選択内容を追加
  cancellationReasons?: string[] // 解約理由のチェックリストを追加
  newEmail: string
  isLimitedProductStore: boolean
  enableSubscription?: boolean // 定期請求オプションを追加
  membershipNumber?: string // 会員番号を追加
}

export interface BaseFormProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  nextStep: () => void
  prevStep?: () => void // オプショナルに変更
}

export interface ErrorMessageProps {
  message: string | null
}

export interface SuccessMessageProps {
  message: string
}

export interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export interface NavButtonProps {
  icon: React.ReactNode
  label: string
}
