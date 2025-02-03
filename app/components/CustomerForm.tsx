import { Droplet } from "phosphor-react" // Import Droplet

// CustomerForm.tsxのreturn部分を更新
return (
  <div className="min-h-screen bg-gray-50">
    <div className="header">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center flex items-center justify-center">
        <Droplet className="mr-2 h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
        顧客情報フォーム
      </h1>
    </div>
    <div className="w-full bg-gray-50 min-h-[calc(100vh-5rem)] py-6 md:py-8 lg:py-10">
      <div className="form-container">
        {step < 7 && <ProgressBar currentStep={step} totalSteps={6} />}
        {error && <ErrorMessage message={error} />}
        <div className="mt-6 md:mt-8 lg:mt-10">{renderStep()}</div>
      </div>
    </div>
  </div>
)

