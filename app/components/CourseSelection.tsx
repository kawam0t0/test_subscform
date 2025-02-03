import { useState } from "react"
import type { Course } from "@/types/course"
import { useFormContext } from "@/components/FormProvider"

interface CourseSelectionProps {
  courses: Course[]
  prevStep: () => void
  nextStep: () => void
}

const CourseSelection: React.FC<CourseSelectionProps> = ({ courses, prevStep, nextStep }) => {
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null)
  const { formData, updateFormData, handleSubmit } = useFormContext()
  const filteredCourses = courses.filter((course) => course.id !== hoveredCourse)

  return (
    <form onSubmit={handleSubmit(nextStep)} className="form-section">
      <div>
        <h2 className="text-xl font-semibold mb-6">コースを選択してください</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const isSelected = formData.course === `${course.name}（月額${course.price}）`

            return (
              <button
                key={course.id}
                type="button"
                className={`course-card ${isSelected ? "selected" : ""}`}
                onClick={() => updateFormData({ course: `${course.name}（月額${course.price}）` })}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
              >
                <div className="text-center space-y-4 w-full">
                  <div className={`font-medium text-lg leading-tight ${isSelected ? "text-primary" : "text-gray-700"}`}>
                    {course.displayName.map((part, index) => (
                      <React.Fragment key={index}>
                        {part}
                        {index < course.displayName.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className={`text-2xl font-bold ${isSelected ? "text-primary" : "text-primary/80"}`}>
                    月額{course.price}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          戻る
        </button>
        <button type="submit" className="btn btn-primary">
          次へ
        </button>
      </div>
    </form>
  )
}

export default CourseSelection

