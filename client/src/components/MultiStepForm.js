import { useState } from "react";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: "",
    engineer: "",
    solarwinds: {
      client: "",
      alert: "no"
    },
    vsan: {
      client: "",
      alert: "no"
    }
  });

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const handleChange = (section, field, value) => {
    if (section === "main") {
      setFormData({ ...formData, [field]: value });
    } else {
      setFormData({
        ...formData,
        [section]: { ...formData[section], [field]: value }
      });
    }
  };

  const handleSubmit = async () => {
    console.log("🟢 Submit clicked");
    console.log("Payload:", formData);

    try {
      const res = await fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      console.log("🔁 API response:", data);

      if (res.ok) {
        alert("✅ Submitted successfully");
      } else {
        alert("❌ Submission failed");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Network error");
    }
  };

  return (
    <div>
      {step === 1 && (
        <>
          <label>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("main", "date", e.target.value)}
          />
          <label>Engineer</label>
          <input
            type="text"
            value={formData.engineer}
            onChange={(e) => handleChange("main", "engineer", e.target.value)}
          />
        </>
      )}

      {step === 2 && (
        <>
          <label>SolarWinds Client</label>
          <input
            type="text"
            value={formData.solarwinds.client}
            onChange={(e) => handleChange("solarwinds", "client", e.target.value)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <label>vSAN Client</label>
          <input
            type="text"
            value={formData.vsan.client}
            onChange={(e) => handleChange("vsan", "client", e.target.value)}
          />
        </>
      )}

      <div style={{ marginTop: "1rem" }}>
        {step > 1 && (
          <button onClick={prev} style={{ marginRight: "1rem" }}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={next}>Next</button>
        ) : (
          <button onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  );
}
