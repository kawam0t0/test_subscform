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
    licensePlate: "", // 追加
    cardToken: "",
    referenceId: "",
    course: "",
    newCarModel: "",
    newCarColor: "",
    newLicensePlate: "", // 追加
    currentCourse: "",
    newCourse: "",
  }

  return <ThankYou formData={dummyFormData} />
}
