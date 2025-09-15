// src/utils/emailBodies.js
/**
 * Plain-text email body builders for the Daily Checks app.
 * Centralizes formatting for Checkpoint, Veeam, VMware, and SolarWinds.
 * Returns plain strings (no URI encoding). openEmail() will encode.
 */

// ---------- Row bodies (optional helpers for per-row emails) ----------
export function buildCheckpointRowBody(row = {}, title = "") {
  const lines = [];
  if (title) lines.push(`Environment: ${title}`);
  lines.push(`Severity: ${row.severity || "-"}`);
  lines.push(`Alert: ${row.name || "-"}`);
  lines.push(`Machine: ${row.machine || "-"}`);
  lines.push(`Details: ${row.details || "-"}`);
  if (row.ticket) lines.push(`Ticket: ${row.ticket}`);
  if (row.notes) lines.push(`Notes: ${row.notes}`);
  return lines.join("\n");
}

export function buildVeeamRowBody(row = {}) {
  const lines = [];
  lines.push(`Type: ${row.type || "-"}`);
  lines.push(`VBR Host: ${row.vbrHost || "-"}`);
  lines.push(`Details: ${row.details || "-"}`);
  if (row.ticket) lines.push(`Ticket: ${row.ticket}`);
  if (row.notes) lines.push(`Notes: ${row.notes}`);
  return lines.join("\n");
}

export function buildVmwareRowBody(row = {}, siteLabel = "") {
  const lines = [];
  if (siteLabel) lines.push(`Site: ${siteLabel}`);
  lines.push(`Alert Type: ${row.alertType || "-"}`);
  lines.push(`vSphere Host: ${row.host || "-"}`);
  lines.push(`Details: ${row.details || "-"}`);
  if (row.ticket) lines.push(`Ticket: ${row.ticket}`);
  if (row.notes) lines.push(`Notes: ${row.notes}`);
  return lines.join("\n");
}

// ---------- Full email bodies (used by Submit flows) ----------
export function buildCheckpointEmailBody(fd = {}) {
  const p = fd || {};
  const d = p.date || new Date().toISOString().slice(0, 10);

  const sectionLines = (title, sec = {}) => {
    const arr = [];
    arr.push(`— ${title} —`);
    arr.push(`Alerts generated: ${sec.alertsGenerated || "N/A"}`);
    if (sec.alertsGenerated === "yes") {
      const rows = sec.alerts || [];
      if (!rows.length) {
        arr.push("No rows entered (but 'yes' selected).");
      } else {
        rows.forEach((a, i) => {
          arr.push(
            `#${i + 1} • [${a.severity || "-"}] ${a.name || "-"} | Machine: ${a.machine || "-"} | Details: ${a.details || "-"} | Ticket: ${a.ticket || "-"}${a.notes ? " | Notes: " + a.notes : ""}`
          );
        });
      }
    } else {
      arr.push("No alerts.");
    }
    arr.push("");
    return arr;
  };

  const lines = [];
  lines.push("Checkpoint Daily Check");
  lines.push(`Engineer: ${p.engineer || "Unknown"}`);
  lines.push(`Date: ${d}`);
  lines.push("");
  lines.push(...sectionLines("Panoptics Global Ltd", p.panoptics || {}));
  lines.push(...sectionLines("The Brewery", p.brewery || {}));
  lines.push("— Meta —");
  lines.push("This message was generated from the daily checks app.");
  return lines.join("\n");
}

export function buildVeeamEmailBody(fd = {}) {
  const p = fd || {};
  const safeDate = p.date || new Date().toISOString().slice(0, 10);

  const lines = [];
  lines.push("Veeam Backup Checklist");
  lines.push(`Engineer: ${p.engineer || "Unknown"}`);
  lines.push(`Date: ${safeDate}`);
  lines.push("");

  lines.push("— Clarion Events —");
  lines.push(`Alerts generated: ${p.alertsGenerated || "N/A"}`);
  if (p.alertsGenerated === "yes" && Array.isArray(p.alerts) && p.alerts.length) {
    p.alerts.forEach((a, i) => {
      lines.push(
        `#${i + 1} • ${a.type || "Type"} | Host: ${a.vbrHost || "-"} | Details: ${a.details || "-"} | Ticket: ${a.ticket || "-"} | Notes: ${a.notes || "-"}`
      );
    });
  } else {
    lines.push("No alerts.");
  }
  lines.push("");

  lines.push("— Local Veeam —");
  lines.push(`Alerts generated: ${p.localAlertsGenerated || "N/A"}`);
  if (p.localAlertsGenerated === "yes" && Array.isArray(p.localAlerts) && p.localAlerts.length) {
    p.localAlerts.forEach((a, i) => {
      lines.push(
        `#${i + 1} • ${a.type || "Type"} | Host: ${a.vbrHost || "-"} | Details: ${a.details || "-"} | Ticket: ${a.ticket || "-"} | Notes: ${a.notes || "-"}`
      );
    });
  } else {
    lines.push("No alerts.");
  }

  lines.push("");
  lines.push("— Meta —");
  lines.push("This message was generated from the daily checks app.");
  return lines.join("\n");
}

export function buildVmwareEmailBody(fd = {}) {
  const p = fd || {};
  const date = p.date || new Date().toISOString().slice(0, 10);

  const buildSectionLines = (name, bucket = {}) => {
    const lines = [];
    const status = bucket?.alert || "N/A";
    lines.push(`— ${name} —`);
    lines.push(`Alerts generated: ${status}`);
    if (status === "yes") {
      const rows = bucket?.rows || [];
      if (!rows.length) {
        lines.push("No rows entered (but 'yes' selected).");
      } else {
        rows.forEach((r, i) => {
          lines.push(
            `#${i + 1} • ${r.alertType || "Type"} | Host: ${r.host || "-"} | Details: ${r.details || "-"} | Ticket: ${r.ticket || "-"} | Notes: ${r.notes || "-"}`
          );
        });
      }
    } else {
      lines.push("No alerts.");
    }
    lines.push("");
    return lines;
  };

  const lines = [];
  lines.push("VMware vSAN Checklist");
  lines.push(`Engineer: ${p.engineer || "Unknown"}`);
  lines.push(`Date: ${date}`);
  lines.push("");
  lines.push(...buildSectionLines("Clarion Events", p.vsan?.alerts?.clarion));
  lines.push(...buildSectionLines("Panoptics Global", p.vsan?.alerts?.panoptics));
  lines.push(...buildSectionLines("Volac International", p.vsan?.alerts?.volac));
  lines.push("— Meta —");
  lines.push("This message was generated from the daily checks app.");
  return lines.join("\n");
}

// ---------- SolarWinds ----------
export function buildSolarWindsEmailBody(fd = {}) {
  const s = (fd && fd.solarwinds) || {};
  const engineer = fd.engineer || "Unknown";
  const date = fd.date || new Date().toISOString().slice(0, 10);

  const lines = [];
  lines.push("SolarWinds Daily Checklist");
  lines.push(`Engineer: ${engineer}`);
  lines.push(`Date: ${date}`);
  lines.push("");
  lines.push(`Services Running: ${s.servicesRunning || "N/A"}`);
  if (String(s.servicesRunning).toLowerCase() === "no") {
    lines.push(`Service Down Ticket: ${s.serviceDownTicket || "-"}`);
  }
  lines.push(`Client: ${s.client || "Multiple"}`);
  lines.push(`Alerts Generated: ${s.alertsGenerated || "N/A"}`);

  if (s.alertsGenerated === "yes" && Array.isArray(s.alerts) && s.alerts.length) {
    lines.push("");
    lines.push("Alerts:");
    s.alerts.forEach((a, i) => {
      lines.push(
        `#${i + 1} • ${a.alertType || "Type"} | ${a.name || "Name"} | ${a.details || "-"} | Time: ${a.time || "-"} | Ticket: ${a.ticket || "-"} | Notes: ${a.notes || "-"}`
      );
    });
  } else {
    lines.push("");
    lines.push("No alerts.");
  }

  lines.push("");
  lines.push("— Meta —");
  lines.push("This message was generated from the daily checks app.");
  return lines.join("\n");
}
