import { Droplet } from "phosphor-react" // Import Droplet

// CustomerForm.tsxのreturn部分を更新
return (
  <div className="min-h-screen bg-gray-50">
    <div className="header">
      <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center">
        <Droplet className="mr-2 h-7 w-7 md:h-8 md:w-8" />
        顧客情報フォーム
      </h1>
    </div>
    <div className="w-full bg-gray-50 min-h-[calc(100vh-5rem)] py-8">
      <div className="form-container">
        {step < 7 && <ProgressBar currentStep={step} totalSteps={6} />}
        {error && <ErrorMessage message={error} />}
        <div className="mt-8">{renderStep()}</div>
      </div>
    </div>
  </div>
)

