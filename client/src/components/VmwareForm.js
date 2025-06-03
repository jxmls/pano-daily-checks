import React, { useEffect } from "react";
import { toast } from "react-hot-toast";
import useDailyCheckForm from "./useDailyCheckForm";

export default function VSANForm({ onBackToDashboard }) {
  const {
    step,
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    selectAll,
    next,
    prev,
    handleSubmit
  } = useDailyCheckForm();

  useEffect(() => {
    const storedName = localStorage.getItem("engineerName");
    if (storedName) {
      handleChange("engineer", null, storedName);
    }
  }, []);

  const handleFinalSubmit = () => {
    toast.success("✅ Submission successful!");
    handleSubmit();
    setTimeout(() => {
      onBackToDashboard();
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 relative">
      <button
        onClick={onBackToDashboard}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
      >
        Home
      </button>
      <div className="flex justify-center mb-4">
        <img src="/panologo.png" alt="Panoptics logo" className="h-20" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-center">VMware vSAN Checks</h1>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-2">
            Please login to the following VMware vSAN Environments.
          </p>
          <ul className="list-disc ml-6 text-sm">
            <li><strong>Clarion Events Ltd.</strong> - use Clarion RDS / UK1-PAN01:
              <ul className="ml-6">
                <li>CT: https://us2-vcsa01.clarionevents.local/</li>
                <li>RP: https://10.75.4.201 / https://10.75.4.202</li>
                <li>TUL: https://us1-vcsa01.clarionevents.local/, https://us3-vcsa01.clarionevents.local/</li>
                <li>SG: https://sg-vc-02.clarionevents.local/</li>
                <li>UK: https://clr-vcs01.clarionevents.local/</li>
              </ul>
            </li>
            <li><strong>Panoptics Global Ltd.</strong> - via Always On VPN or Panoptics RDS:
              <ul className="ml-6">
                <li>https://uk-pan-vcs01.panoptics.local/ui/</li>
                <li>https://172.16.17.200/</li>
                <li>https://172.16.17.88/ui/</li>
                <li>https://backup-vsan-vcsa01.panoptics.local/</li>
              </ul>
            </li>
            <li><strong>Volac International</strong> - connect via Cisco AnyConnect VPN:
              <ul className="ml-6">
                <li>https://10.22.1.200/</li>
              </ul>
            </li>
          </ul>
          <div className="flex gap-4 mt-4">
            <button onClick={onBackToDashboard} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
            <button onClick={next} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded">Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Client(s)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.vsan?.client || ""}
              onChange={(e) => handleChange("vsan", "client", e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Alert Generated</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.vsan?.alert || ""}
              onChange={(e) => handleChange("vsan", "alert", e.target.value)}
            >
              <option value="">Select option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <table className="min-w-full table-auto border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="border px-2 py-1">vSphere Host</th>
                <th className="border px-2 py-1">Alert Type</th>
                <th className="border px-2 py-1">Details</th>
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.vsan?.alerts?.map((alert, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={alert.selected || false}
                      onChange={() => toggleRowSelection(index)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full"
                      value={alert.host || ""}
                      onChange={(e) => handleAlertChange(index, "host", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      className="w-full"
                      value={alert.type || ""}
                      onChange={(e) => handleAlertChange(index, "type", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Critical">Critical</option>
                      <option value="Warning">Warning</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full"
                      value={alert.details || ""}
                      onChange={(e) => handleAlertChange(index, "details", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {alert.selected && (
                      <button
                        className="text-blue-600 hover:underline text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const subject = encodeURIComponent(`VMware vSAN Alert: ${alert.host}`);
                          const body = encodeURIComponent(
                            `Client: ${formData.vsan?.client || 'Multiple'}\n` +
                            `Host: ${alert.host}\nAlert Type: ${alert.type}\nDetails: ${alert.details}\nAssign to: ${formData.engineer}`
                          );
                          window.location.href = `mailto:yourticketing@email.com?subject=${subject}&body=${body}`;
                        }}
                      >
                        📧 Create Ticket
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4 mt-2">
            <button onClick={addAlertRow} className="text-blue-600 text-sm">➕ Add Row</button>
            <button onClick={deleteSelectedRows} className="text-red-600 text-sm">🗑️ Delete Selected</button>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={prev} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
            <button onClick={handleFinalSubmit} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}
