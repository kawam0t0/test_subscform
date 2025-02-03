import type { NextApiRequest, NextApiResponse } from "next"
// ... other imports ...

type Operation = "入会" | "洗車コース変更" | "登録車両変更"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // ... other code ...

  const operation: Operation = req.body.operation // Declare operation variable

  // バリデーションロジックを更新
  // 洗車コース変更時のみ必須
  if (operation === "洗車コース変更") {
    if (!currentCourse) missingFields.push("currentCourse")
    if (!newCourse) missingFields.push("newCourse")
  }

  // Google Sheetsデータを更新
  const sheetData = [
    [
      actualReferenceId,
      operation,
      store,
      operation === "入会" ? courseName : "",
      operation === "洗車コース変更" ? formData.currentCourse : "",
      operation === "洗車コース変更" ? formData.newCourse : "",
      "",
      name,
      email,
      phone,
      carModel,
      carColor,
      operation === "登録車両変更" ? newCarModel : "",
      operation === "登録車両変更" ? newCarColor : "",
    ],
  ]

  // ... rest of the code ...
}

export default handler

