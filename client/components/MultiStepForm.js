import { useState } from "react";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: "",
    engineer: "",
    solarwinds: {
      client: "",
      alert: "no",
      alertType: "",
      alertInfo: "",
      ticket: ""
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
    console.log("🟢 Submit button clicked");
    console.log("Payload:", formData);

    try {
      const res = await fetch("https://pano-daily-checks.onrender.com/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("🔁 API response:", data);

      if (res.ok) {
        alert("✅ Submission successful!");
      } else {
        alert("❌ Submission failed.");
      }
    } catch (error) {
      console.error("❌ Submit error:", error);
      alert("❌ Network error.");
    }
  };

  return (
    <div>
          <h1>Daily Infrastructure Check 🚀</h1>
      {step === 1 && (
        <div>
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
        </div>
      )}

      {step === 2 && (
        <div>
          <label>SolarWinds Client</label>
          <input
            type="text"
            value={formData.solarwinds.client}
            onChange={(e) => handleChange("solarwinds", "client", e.target.value)}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <label>vSAN Client</label>
          <input
            type="text"
            value={formData.vsan.client}
            onChange={(e) => handleChange("vsan", "client", e.target.value)}
          />
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        {step > 1 && (
          <button type="button" onClick={prev} style={{ marginRight: "1rem" }}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={next}>Next</button>
        ) : (
          <button type="button" onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  );
}
