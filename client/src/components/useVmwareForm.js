// useVmwareForm.js
import { useState } from "react";
import jsPDF from "jspdf";

const defaultVmwareRow = {
  alertType: "",
  host: "",
  details: "",
  ticket: "",
  notes: "",
  selected: false,
};

export default function useVmwareForm() {
  const [formData, setFormData] = useState({
    engineer: "",
    date: "",
    vsan: {
      alerts: {},
    },
  });

 const handleChange = (section, path, value) => {
  setFormData((prevData) => {
    const updated = { ...prevData };

    // ✅ If no section is provided, treat it as top-level (e.g., engineer, date)
    if (!section) {
      updated[path] = value;
      return updated;
    }

    // ✅ Otherwise, nested field logic
    if (!updated[section]) updated[section] = {};
    const keys = path.split(".");
    let temp = updated[section];
    for (let i = 0; i < keys.length - 1; i++) {
      if (!temp[keys[i]]) temp[keys[i]] = {};
      temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = value;
    return updated;
  });
};



  const handleAlertChange = (section, key, index, field, value) => {
    setFormData((prev) => {
      const updatedRows = [...(prev[section].alerts[key]?.rows || [])];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...prev[section].alerts[key],
              rows: updatedRows,
            },
          },
        },
      };
    });
  };

  const addAlertRow = (section, key) => {
    setFormData((prev) => {
      const current = prev[section].alerts[key]?.rows || [];
      const updatedRows = [...current, { ...defaultVmwareRow }];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...prev[section].alerts[key],
              rows: updatedRows,
              selectAll: false,
            },
          },
        },
      };
    });
  };

 const toggleRowSelection = (section, key, index) => {
  setFormData((prev) => {
    const sectionData = prev[section]?.alerts?.[key];
    if (!sectionData || !sectionData.rows || !sectionData.rows[index]) return prev;

    const updatedRows = [...sectionData.rows];
    updatedRows[index] = {
      ...updatedRows[index],
      selected: !updatedRows[index].selected,
    };

    return {
      ...prev,
      [section]: {
        ...prev[section],
        alerts: {
          ...prev[section].alerts,
          [key]: {
            ...prev[section].alerts[key],
            rows: updatedRows,
          },
        },
      },
    };
  });
};


  const deleteSelectedRows = (section, key) => {
    setFormData((prev) => {
      const remainingRows = prev[section].alerts[key].rows.filter((r) => !r.selected);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...prev[section].alerts[key],
              rows: remainingRows,
            },
          },
        },
      };
    });
  };

  const toggleSelectAll = (section, key) => {
    setFormData((prev) => {
      const current = prev[section].alerts[key] || { rows: [], selectAll: false };
      const newSelectAll = !current.selectAll;
      const updatedRows = current.rows.map((row) => ({ ...row, selected: newSelectAll }));
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...current,
              rows: updatedRows,
              selectAll: newSelectAll,
            },
          },
        },
      };
    });
  };

  

const handleSubmit = () => {
  const engineer = formData.engineer?.trim() || "unknown";

  // Extract initials
  const initials = engineer
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("") || "XX";

  const dateObj = new Date(formData.date);
  const datePart = !isNaN(dateObj)
    ? dateObj.toISOString().split("T")[0]
    : "unknown-date";

  const fileName = `vsan-checklist-${initials}-${datePart}.pdf`;

  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text(`vSAN Daily Checklist`, 10, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Date: ${datePart}`, 10, y);
  y += 6;
  doc.text(`Engineer: ${initials}`, 10, y);
  y += 10;

  const alerts = formData.vsan?.alerts || {};
  Object.entries(alerts).forEach(([key, section]) => {
    doc.setFont(undefined, "bold");
    doc.text(`Client: ${key}`, 10, y);
    y += 6;
    doc.setFont(undefined, "normal");

    doc.text(`Alert Generated: ${section.alert || "unknown"}`, 10, y);
    y += 6;

    if (section.alert === "yes" && Array.isArray(section.rows)) {
      section.rows.forEach((row, i) => {
        doc.text(`• Alert ${i + 1}`, 12, y);
        y += 6;
        doc.text(`  - Type: ${row.alertType || "-"}`, 14, y);
        y += 6;
        doc.text(`  - Host: ${row.host || "-"}`, 14, y);
        y += 6;
        doc.text(`  - Details: ${row.details || "-"}`, 14, y);
        y += 6;
        doc.text(`  - Ticket: ${row.ticket || "-"}`, 14, y);
        y += 6;
        doc.text(`  - Notes: ${row.notes || "-"}`, 14, y);
        y += 8;
      });
    } else {
      y += 4;
    }

    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(fileName);
};



  const generateTicketBody = (alert, key) => {
  const engineer = typeof formData.engineer === "string"
    ? formData.engineer
    : formData.engineer?.name || "Unknown";

  return encodeURIComponent(
    `Environment: ${key}\n` +
    `Alert Type: ${alert.alertType}\n` +
    `Host: ${alert.host}\n` +
    `Details: ${alert.details}\n` +
    `Ticket: ${alert.ticket || "-"}\n` +
    `Notes: ${alert.notes || "-"}\n` +
    `Engineer: ${engineer}`
  );
};

const generateTicketSubject = (alert) =>
  encodeURIComponent(`vSAN Alert - ${alert.host || "Unknown Host"}`);

  return {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    handleSubmit,
    generateTicketBody,
    generateTicketSubject,
  };
}
