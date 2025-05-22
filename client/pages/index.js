import MultiStepForm from "../components/MultiStepForm";

export default function Home() {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4">🛠️ Daily Infrastructure Check</h1>
        <MultiStepForm />
      </div>
    </div>
  );
}
