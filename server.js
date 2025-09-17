// server.js (top-level, CommonJS)
const express = require("express");
const cors = require("cors");
const db = require("./api/db.cjs"); // uses your Pool built from env vars

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

/** Simple DB-backed health check */
app.get("/api/health", async (_req, res) => {
  try {
    const r = await db.query("select now() as now");
    res.json({ ok: true, db: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, db: false, error: e.message });
  }
});

/** Ingest submissions from the client modules */
app.post("/api/submissions", async (req, res) => {
  try {
    const { module, engineer, payload } = req.body || {};
    if (!module || !engineer) {
      return res.status(400).json({ ok: false, error: "Missing module or engineer" });
    }

    // Use provided date (if any) or now; DB compares on ::date
    const date = payload?.date ? new Date(payload.date) : new Date();

    if (module === "solarwinds") {
      const solarClient = payload?.solarwinds?.client || "Multiple";
      const solarAlert = String(payload?.solarwinds?.alertsGenerated || "").toLowerCase() === "yes";

      const upd = await db.query(
        `update "Submission"
           set "solarClient"=$3, "solarAlert"=$4
         where engineer=$2 and date::date=$1::date`,
        [date, engineer, solarClient, solarAlert]
      );
      if (upd.rowCount === 0) {
        await db.query(
          `insert into "Submission"(date, engineer, "solarClient", "solarAlert", "vsanClient", "vsanAlert")
           values ($1,$2,$3,$4,null,null)`,
          [date, engineer, solarClient, solarAlert]
        );
      }
      return res.json({ ok: true });
    }

    if (module === "vsan") {
      const vsan = payload?.vsan || {};
      const vsanClient = vsan?.client || vsan?.selectedClient || "Multiple";
      const vsanAlert = String(vsan?.alertsGenerated || "").toLowerCase() === "yes";

      const upd = await db.query(
        `update "Submission"
           set "vsanClient"=$3, "vsanAlert"=$4
         where engineer=$2 and date::date=$1::date`,
        [date, engineer, vsanClient, vsanAlert]
      );
      if (upd.rowCount === 0) {
        await db.query(
          `insert into "Submission"(date, engineer, "solarClient", "solarAlert", "vsanClient", "vsanAlert")
           values ($1,$2,null,null,$3,$4)`,
          [date, engineer, vsanClient, vsanAlert]
        );
      }

      // Optional per-client rollups (Clarion/Panoptics/Volac)
      const buckets = vsan?.alerts || {};
      const writeVmware = async (clientName, bucket) => {
        if (!bucket) return;
        const alert = String(bucket?.alert || bucket?.alertsGenerated || "").toLowerCase() === "yes";
        await db.query(
          `insert into "VmwareSubmission"(date, engineer, client, alert) values ($1,$2,$3,$4)`,
          [date, engineer, clientName, alert]
        );
      };
      await Promise.all([
        writeVmware("Clarion Events", buckets?.clarion),
        writeVmware("Panoptics Global", buckets?.panoptics),
        writeVmware("Volac International", buckets?.volac),
      ]);

      return res.json({ ok: true });
    }

    if (module === "veeam") {
      const add = (r) =>
        db.query(
          `insert into "VeeamSubmission"(date, engineer, "vbrHost", type, details, ticket, notes)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [date, engineer, r?.vbrHost || null, r?.type || null, r?.details || null, r?.ticket || null, r?.notes || null]
        );

      const clarion = Array.isArray(payload?.alerts) ? payload.alerts : [];
      const local = Array.isArray(payload?.localAlerts) ? payload.localAlerts : [];
      await Promise.all([...clarion.map(add), ...local.map(add)]);
      return res.json({ ok: true });
    }

    if (module === "checkpoint") {
      const writeSection = async (sectionKey, label) => {
        const s = payload?.[sectionKey];
        if (!s) return;
        const alertStatus = String(s.alertsGenerated || "").toLowerCase();
        const details = s.details || "";
        const reference = s.reference || "";

        const ins = await db.query(
          `insert into "CheckpointSubmission"(date, engineer, section, "alertStatus", details, reference)
           values ($1,$2,$3,$4,$5,$6)
           returning id`,
          [date, engineer, label, alertStatus, details, reference]
        );
        const checkpointId = ins.rows[0].id;

        const addAlert = (r) =>
          db.query(
            `insert into "CheckpointAlert"("checkpointId", severity, name, machine, details, ticket, notes)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [
              checkpointId,
              r?.severity || null,
              r?.name || null,
              r?.machine || null,
              r?.details || null,
              r?.ticket || null,
              r?.notes || null,
            ]
          );

        const rows = Array.isArray(s.alerts) ? s.alerts : [];
        await Promise.all(rows.map(addAlert));
      };

      await writeSection("panoptics", "Panoptics");
      await writeSection("brewery", "The Brewery");
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "Unknown module" });
  } catch (e) {
    console.error("[/api/submissions] error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** Graceful shutdown */
const server = app.listen(process.env.PORT || 8080, () =>
  console.log(`API listening on ${process.env.PORT || 8080}`)
);
function shutdown(sig) {
  console.log(`${sig} received, closing server…`);
  server.close(() => {
    db.pool.end().finally(() => process.exit(0));
  });
}
["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
