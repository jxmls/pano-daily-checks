// useVmwareForm.js
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";

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
      alerts: {}, // key: { alert: "", rows: [], selectAll: false }
    },
  });

  const handleChange = (section, path, value) => {
    setFormData((prevData) => {
      const updated = { ...prevData };

      if (!section) {
        updated[path] = value;
        return updated;
      }

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
      const currentRows = prev?.[section]?.alerts?.[key]?.rows || [];
      const updatedRows = [...currentRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };

      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...(prev[section].alerts[key] || {}),
              rows: updatedRows,
            },
          },
        },
      };
    });
  };

  const addAlertRow = (section, key) => {
    setFormData((prev) => {
      const currentRows = prev?.[section]?.alerts?.[key]?.rows || [];
      const updatedRows = [...currentRows, { ...defaultVmwareRow }];

      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...(prev[section].alerts[key] || {}),
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
      const currentRows = prev?.[section]?.alerts?.[key]?.rows || [];
      if (!currentRows[index]) return prev;

      const updatedRows = [...currentRows];
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
              ...(prev[section].alerts[key] || {}),
              rows: updatedRows,
            },
          },
        },
      };
    });
  };

  const deleteSelectedRows = (section, key) => {
    setFormData((prev) => {
      const currentRows = prev?.[section]?.alerts?.[key]?.rows || [];
      const remainingRows = currentRows.filter((r) => !r.selected);

      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...(prev[section].alerts[key] || {}),
              rows: remainingRows,
              selectAll: false,
            },
          },
        },
      };
    });
  };

  const toggleSelectAll = (section, key) => {
    setFormData((prev) => {
      const current = prev?.[section]?.alerts?.[key] || { rows: [], selectAll: false };
      const newSelectAll = !current.selectAll;
      const updatedRows = (current.rows || []).map((row) => ({
        ...row,
        selected: newSelectAll,
      }));

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
    const initials =
      engineer
        .split(" ")
        .map((part) => part[0]?.toUpperCase())
        .join("") || "XX";

    const dateObj = new Date(formData.date);
    const date = !isNaN(dateObj) ? dateObj.toISOString().split("T")[0] : "unknown-date";

    const fileName = `vsan-checklist-${initials}-${date}.pdf`;
    const doc = new jsPDF();

    addHeader(doc, "vSAN Daily Checklist", engineer, date);

    let y = 50;
    const alerts = formData.vsan?.alerts || {};

    Object.entries(alerts).forEach(([key, section]) => {
      doc.setFont(undefined, "bold");
      doc.text(`Client: ${key}`, 14, y);
      y += 7;
      doc.setFont(undefined, "normal");

      doc.text(`Alert Generated: ${section.alert || "no"}`, 14, y);
      y += 7;

      if (section.alert === "yes" && Array.isArray(section.rows) && section.rows.length > 0) {
        const tableRows = section.rows.map((row, index) => [
          index + 1,
          row.alertType || "-",
          row.host || "-",
          row.details || "-",
          row.ticket || "-",
          row.notes || "-",
        ]);

        autoTable(doc, {
          startY: y + 2,
          head: [["#", "Type", "Host", "Details", "Ticket", "Notes"]],
          body: tableRows,
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [40, 116, 166],
            textColor: 255,
            halign: "center",
          },
          margin: { left: 14, right: 14 },
        });

        y = doc.lastAutoTable.finalY + 10;
      } else {
        y += 8;
      }

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(fileName);
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
    generateTicketSubject,
  };
}
