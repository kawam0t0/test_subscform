export interface FormData {
  operation: string
  store: string
  name: string
  email: string
  phone: string
  carModel: string
  carColor: string
  cardToken: string
  referenceId: string
  course: string
  // 車両変更用の新しいフィールド
  newCarModel: string
  newCarColor: string
}

export interface ErrorMessageProps {
  message: string
}

export interface SuccessMessageProps {
  message: string
}

export interface BaseFormProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  nextStep: () => void
  prevStep?: () => void
}

export interface NavButtonProps {
  icon: JSX.Element
  label: string
}

export interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export interface ConfirmationProps {
  formData: FormData
  prevStep: () => void
  submitForm: () => void
}

