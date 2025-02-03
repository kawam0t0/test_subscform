import { CreditCard } from "@mui/icons-material"
import type { FormData } from "../types" // Assuming FormData type is defined here

interface ConfirmationItemProps {
  icon: JSX.Element
  label: string
  value: string | number
}

const ConfirmationItem: React.FC<ConfirmationItemProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    {icon}
    <div>
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  </div>
)

const Confirmation: React.FC<{ formData: FormData }> = ({ formData }) => {
  // Confirmationコンポーネントの表示項目を更新
  return (
    <>
      {formData.operation === "洗車コース変更" && (
        <>
          <ConfirmationItem
            icon={<CreditCard className="text-primary" />}
            label="現在のコース"
            value={formData.currentCourse}
          />
          <ConfirmationItem
            icon={<CreditCard className="text-primary" />}
            label="新しいコース"
            value={formData.newCourse}
          />
        </>
      )}
    </>
  )
}

export default Confirmation

