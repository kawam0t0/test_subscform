export interface FormData {
  operation: string
  store: string
  name: string
  email: string
  phone: string
  carModel: string
  carColor: string
  licensePlate: string // 追加
  cardToken: string
  referenceId: string
  course: string
  newCarModel: string
  newCarColor: string
  newLicensePlate: string // 追加
  currentCourse: string
  newCourse: string
  inquiryDetails?: string // Add this line
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

