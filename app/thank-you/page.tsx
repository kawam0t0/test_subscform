"use client"

import { ThankYou } from "../components/ThankYou"
import type { FormData } from "../types"

export default function ThankYouPage() {
  // ダミーのformDataを作成
  const dummyFormData: FormData = {
    operation: "",
    store: "",
    familyName: "",
    givenName: "",
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
    newEmail: "",
    campaignCode: "",
    isLimitedProductStore: false, // 追加
  }

  return <ThankYou formData={dummyFormData} />
}

