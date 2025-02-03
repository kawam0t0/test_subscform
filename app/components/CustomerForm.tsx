import { useState } from "react"
import OperationSelection from "./OperationSelection"
import PersonalInfo from "./PersonalInfo"
import CourseChangeForm from "./CourseChangeForm"
import VehicleInfo from "./VehicleInfo"
import CourseSelection from "./CourseSelection"
import NewVehicleInfo from "./NewVehicleInfo"
import Confirmation from "./Confirmation"
import ThankYou from "./ThankYou"

interface FormData {
  operation: string
  // ... other form data properties
}

const CustomerForm: React.FC = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({ operation: "" })

  const updateFormData = (updatedData: Partial<FormData>) => {
    setFormData({ ...formData, ...updatedData })
  }

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const submitForm = () => {
    // Submit the form data
    console.log("Form data submitted:", formData)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <OperationSelection formData={formData} updateFormData={updateFormData} nextStep={nextStep} />
      case 2:
        return (
          <PersonalInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
        )
      case 3:
        if (formData.operation === "洗車コース変更") {
          return (
            <CourseChangeForm
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        }
        return (
          <VehicleInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
        )
      case 4:
        if (formData.operation === "入会") {
          return (
            <CourseSelection
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else if (formData.operation === "登録車両変更") {
          return (
            <NewVehicleInfo
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )
        } else {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        }
      case 5:
        if (formData.operation === "入会") {
          return (
            <PaymentInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
          )
        } else if (formData.operation === "登録車両変更") {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        } else {
          return <ThankYou />
        }
      case 6:
        if (formData.operation === "入会") {
          return <Confirmation formData={formData} prevStep={prevStep} submitForm={submitForm} />
        } else {
          return <ThankYou />
        }
      case 7:
        return <ThankYou />
      default:
        return null
    }
  }

  return <div>{renderStep()}</div>
}

export default CustomerForm

