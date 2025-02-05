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
    licensePlate: "",
    cardToken: "",
    referenceId: "",
    course: "",
    newCarModel: "",
    newCarColor: "",
    newLicensePlate: "",
    currentCourse: "",
    newCourse: "",
    inquiryDetails: "",
    newEmail: "", // Add the newEmail property with an empty string as default value
  }

  return <ThankYou formData={dummyFormData} />
}

