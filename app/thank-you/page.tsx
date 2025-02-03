"use client"

import { ThankYou } from "../components/ThankYou"
import type { FormData } from "../types"

export default function ThankYouPage() {
  // ダミーのformDataを作成
  const dummyFormData: FormData = {
    operation: "",
    store: "",
    name: "",
    email: "",
    phone: "",
    carModel: "",
    carColor: "",
    cardToken: "",
    referenceId: "",
    course: "",
    newCarModel: "",
    newCarColor: "",
    currentCourse: "",
    newCourse: "",
  }

  return <ThankYou formData={dummyFormData} />
}
