import React, { useState } from "react";

const engineers = ["Jose Lucar", "Alex Field", "Mihir Sangani"];
const alertTypes = [
  "Warning",
  "Serious",
  "Critical",
  "Warning & Serious",
  "Warning and Critical",
  "Serious and Critical",
  "Warning Serious & Critical"
];

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: "",
    engineer: "",
    solarwinds: {
      servicesRunning: "",
      client: "",
      alertType: "",
      alerts: [{ name: "", details: "", time: "", ticket: "", notes: "" }]
    }
  });

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

  const handleAlertChange = (index, field, value) => {
    const updatedAlerts = [...formData.solarwinds.alerts];
    updatedAlerts[index][field] = value;
    setFormData({
      ...formData,
      solarwinds: { ...formData.solarwinds, alerts: updatedAlerts }
    });
  };

  const addAlertRow = () => {
    setFormData({
      ...formData,
      solarwinds: {
        ...formData.solarwinds,
        alerts: [...formData.solarwinds.alerts, { name: "", details: "", time: "", ticket: "", notes: "" }]
      }
    });
  };

  return (
    <div style={{ padding: "1rem" }}>
      {step === 1 && (
        <>
          <h1>Daily Infrastructure Checks 🚀</h1>
          <p>This is a daily checklist to check and address any alerts flagged in the following monitoring tools:</p>
          <ul>
            <li>SolarWinds</li>
            <li>VMware vSAN</li>
          </ul>

          <label>Date</label><br />
          <input type="date" value={formData.date} onChange={(e) => handleChange("main", "date", e.target.value)} /><br /><br />

          <label>Engineer</label><br />
          <select value={formData.engineer} onChange={(e) => handleChange("main", "engineer", e.target.value)}>
            <option value="">Select Engineer</option>
            {engineers.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <br /><br />
          <button onClick={() => setStep(2)}>Next</button>
        </>
      )}

      {step === 2 && (
        <>
          <h1>SolarWinds</h1>
          <p>SolarWinds can be accessed from your laptop if connected to Always On VPN, or via Panoptics RDS → https://panglsw01.</p>
          <p>Also check the SolarWinds server to confirm all services are running:</p>
          <ol>
            <li>Login to SolarWinds Server</li>
            <li>Go to Windows → SolarWinds Platform → SolarWinds Platform Service Manager</li>
            <li>Ensure all services are running</li>
          </ol>

          <label>SolarWinds services running?</label><br />
          <select value={formData.solarwinds.servicesRunning} onChange={(e) => handleChange("solarwinds", "servicesRunning", e.target.value)}>
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select><br /><br />

          <label>Clients</label><br />
          <input type="text" value={formData.solarwinds.client} onChange={(e) => handleChange("solarwinds", "client", e.target.value)} /><br /><br />

          <label>Alert Type</label><br />
          <select value={formData.solarwinds.alertType} onChange={(e) => handleChange("solarwinds", "alertType", e.target.value)}>
            <option value="">Select</option>
            {alertTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select><br /><br />

          <h3>Alert Information</h3>
          <table border="1" cellPadding="4">
            <thead>
              <tr>
                <th>Alert Name</th>
                <th>Details</th>
                <th>Trigger Time</th>
                <th>Ticket</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {formData.solarwinds.alerts.map((row, idx) => (
                <tr key={idx}>
                  <td><input value={row.name} onChange={(e) => handleAlertChange(idx, "name", e.target.value)} /></td>
                  <td><input value={row.details} onChange={(e) => handleAlertChange(idx, "details", e.target.value)} /></td>
                  <td><input value={row.time} onChange={(e) => handleAlertChange(idx, "time", e.target.value)} /></td>
                  <td><input value={row.ticket} onChange={(e) => handleAlertChange(idx, "ticket", e.target.value)} /></td>
                  <td><input value={row.notes} onChange={(e) => handleAlertChange(idx, "notes", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addAlertRow} style={{ marginTop: "0.5rem" }}>➕ Add Row</button><br /><br />

          <button onClick={() => setStep(1)}>Back</button>
          <button onClick={() => console.log(formData)} style={{ marginLeft: "1rem" }}>Continue</button>
        </>
      )}
    </div>
  );
}