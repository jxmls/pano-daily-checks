// server.js (top-level, CommonJS)
const express = require("express");
const cors = require("cors");
const db = require("./api/db.cjs"); // uses your Pool built from env vars

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// ---------------------------------------------------------------------------
// Helper: mirror any submission into the unified `submissions` table
// ---------------------------------------------------------------------------
async function mirrorToSubmissions({ date, module, engineer, hasAlerts, payload, source = "mirror" }) {
  try {
    const formDate = (date || new Date()).toISOString().slice(0, 10); // YYYY-MM-DD
    await db.query(
      `insert into submissions (form_date, module, engineer, has_alerts, payload, source)
       values ($1,$2,$3,$4,$5,$6)`,
      [formDate, module, engineer || null, !!hasAlerts, payload || {}, source]
    );
  } catch (e) {
    console.warn("[mirrorToSubmissions] skipped:", e.message);
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
/** Simple DB-backed health check */
app.get("/api/health", async (_req, res) => {
  try {
    const r = await db.query("select now() as now");
    res.json({ ok: true, db: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, db: false, error: e.message });
  }
});

// ---------------------------------------------------------------------------
// Ingest submissions from the client modules
// ---------------------------------------------------------------------------
app.post("/api/submissions", async (req, res) => {
  try {
    const { module, engineer, payload } = req.body || {};
    if (!module || !engineer) {
      return res.status(400).json({ ok: false, error: "Missing module or engineer" });
    }

    // Use provided date (if any) or now; DB compares on ::date
    const date = payload?.date ? new Date(payload.date) : new Date();

    // ------------------------------------ SOLARWINDS ------------------------------------
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

      await mirrorToSubmissions({
        date,
        module: "solarwinds",
        engineer,
        hasAlerts: solarAlert,
        payload,
      });
      return res.json({ ok: true });
    }

    // ---------------------------------------- VSAN --------------------------------------
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

      await mirrorToSubmissions({
        date,
        module: "vsan",
        engineer,
        hasAlerts: vsanAlert,
        payload,
      });
      return res.json({ ok: true });
    }

    // --------------------------------------- VEEAM --------------------------------------
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

      await mirrorToSubmissions({
        date,
        module: "veeam",
        engineer,
        hasAlerts: (clarion.length + local.length) > 0,
        payload,
      });
      return res.json({ ok: true });
    }

    // ------------------------------------- CHECKPOINT -----------------------------------
    if (module === "checkpoint") {
      const writeSection = async (sectionKey, label) => {
        const s = payload?.[sectionKey];
        if (!s) return null;
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
        return { alertStatus, rowsCount: rows.length };
      };

      const pan = await writeSection("panoptics", "Panoptics");
      const bre = await writeSection("brewery", "The Brewery");

      const anyYes = [pan?.alertStatus, bre?.alertStatus]
        .map((x) => String(x || "").toLowerCase())
        .includes("yes");
      const anyRows = (pan?.rowsCount || 0) + (bre?.rowsCount || 0) > 0;

      await mirrorToSubmissions({
        date,
        module: "checkpoint",
        engineer,
        hasAlerts: !!(anyYes || anyRows),
        payload,
      });
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "Unknown module" });
  } catch (e) {
    console.error("[/api/submissions] error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------------------------------------------------------------------------
// Read from the new mirror table (optional but handy)
// ---------------------------------------------------------------------------
app.get("/api/submissions", async (req, res) => {
  try {
    const { date } = req.query;
    const ps = [];
    const where = date ? (ps.push(date), "where form_date = $1") : "";
    const { rows } = await db.query(
      `select * from submissions ${where} order by created_at desc limit 100`,
      ps
    );
    res.json({ rows });
  } catch (e) {
    console.error("GET /api/submissions", e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

// ---------------------------------------------------------------------------
// Compliance: load range
// ---------------------------------------------------------------------------
app.get('/api/compliance', async (req, res) => {
  try {
    const { from, to } = req.query;
    const wh = [];
    const ps = [];
    if (from) { ps.push(from); wh.push(`date >= $${ps.length}`); }
    if (to)   { ps.push(to);   wh.push(`date <= $${ps.length}`); }

    const sql = `
      select
        date::date          as date,
        acknowledged,
        coalesce(note,'')   as note,
        last_updated        as "lastUpdated"
      from "Compliance"
      ${wh.length ? `where ${wh.join(' and ')}` : ''}
      order by date desc
    `;
    const { rows } = await db.query(sql, ps);
    res.json({ ok: true, items: rows });
  } catch (e) {
    console.error('GET /api/compliance', e);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// ---------------------------------------------------------------------------
// Compliance: upsert a single day (ack/note)
// ---------------------------------------------------------------------------
app.post('/api/compliance/:date', async (req, res) => {
  try {
    const date = String(req.params.date || '').slice(0, 10); // YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error: 'invalid date' });
    }

    const ack  = (req.body?.acknowledged === undefined) ? null : !!req.body.acknowledged;
    const note = (req.body?.note ?? null);

    const sql = `
      insert into "Compliance"(date, acknowledged, note, last_updated)
      values ($1, $2, $3, now())
      on conflict (date) do update set
        acknowledged = coalesce(excluded.acknowledged, "Compliance".acknowledged),
        note         = coalesce(excluded.note,         "Compliance".note),
        last_updated = now()
      returning
        date::date        as date,
        acknowledged,
        coalesce(note,'') as note,
        last_updated      as "lastUpdated"
    `;
    const { rows } = await db.query(sql, [date, ack, note]);
    res.json({ ok: true, item: rows[0] });
  } catch (e) {
    console.error('POST /api/compliance/:date', e);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// ---------------------------------------------------------------------------
// Aggregated view for Admin Portal (legacy -> unified shape)
// ---------------------------------------------------------------------------
app.get('/api/all', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Build WHERE/date filters
    const ps = [];
    theWhere = [];
    const wh = [];
    if (from) { ps.push(from); wh.push(`date::date >= $${ps.length}`); }
    if (to)   { ps.push(to);   wh.push(`date::date <= $${ps.length}`); }
    const where = wh.length ? `where ${wh.join(' and ')}` : '';

    // Pull each source
    const sub = await db.query(
      `select date::date as date, engineer,
              "solarClient" as solarclient, "solarAlert" as solaralert,
              "vsanClient" as vsanclient, "vsanAlert" as vsanalert,
              created_at
         from "Submission" ${where}
        order by created_at desc`, ps);

    const veeam = await db.query(
      `select date::date as date, engineer, "vbrHost", type, details, ticket, notes, created_at
         from "VeeamSubmission" ${where}
        order by created_at desc`, ps);

    const vmw = await db.query(
      `select date::date as date, engineer, client, alert, created_at
         from "VmwareSubmission" ${where}
        order by created_at desc`, ps);

    const cps = await db.query(
      `select s.id, s.date::date as date, s.engineer, s.section, s."alertStatus",
              s.details, s.reference, s.created_at,
              coalesce(json_agg(json_build_object(
                'severity',a.severity,'name',a.name,'machine',a.machine,
                'details',a.details,'ticket',a.ticket,'notes',a.notes
              ) ) filter (where a.id is not null), '[]') as alerts
         from "CheckpointSubmission" s
    left join "CheckpointAlert" a on a."checkpointId" = s.id
        ${where ? where.replaceAll('date', 's.date') : ''}
     group by s.id
     order by s.created_at desc`, ps);

    // Map rows into the “submissions” the client already understands
    const out = [];

    // SolarWinds / vSAN (daily roll-ups)
    for (const r of sub.rows) {
      if (r.solarclient != null) {
        out.push({
          module: 'solarwinds',
          engineer: r.engineer,
          createdAt: r.date, // date-only is fine for your UI
          payload: { solarwinds: { client: r.solarclient, alertsGenerated: r.solaralert ? 'Yes' : 'No' } }
        });
      }
      if (r.vsanclient != null) {
        out.push({
          module: 'vsan',
          engineer: r.engineer,
          createdAt: r.date,
          payload: { vsan: { client: r.vsanclient, alertsGenerated: r.vsanalert ? 'Yes' : 'No' } }
        });
      }
    }

    // Veeam (one row per alert kept as a single submission payload)
    for (const r of veeam.rows) {
      out.push({
        module: 'veeam',
        engineer: r.engineer,
        createdAt: r.date,
        payload: {
          alerts: [{
            vbrHost: r.vbrHost, type: r.type, details: r.details, ticket: r.ticket, notes: r.notes
          }]
        }
      });
    }

    // VMware per-client
    for (const r of vmw.rows) {
      out.push({
        module: 'vsan',
        engineer: r.engineer,
        createdAt: r.date,
        payload: { vsan: { client: r.client, alertsGenerated: r.alert ? 'Yes' : 'No' } }
      });
    }

    // Check Point (two sections + nested alerts)
    for (const r of cps.rows) {
      out.push({
        module: 'checkpoint',
        engineer: r.engineer,
        createdAt: r.date,
        payload: {
          [r.section?.toLowerCase().includes('brew') ? 'brewery' : 'panoptics']: {
            alertsGenerated: r.alertStatus,
            details: r.details,
            reference: r.reference,
            alerts: r.alerts || []
          }
        }
      });
    }

    // Newest first (your UI expects this)
    out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Startup / graceful shutdown
// ---------------------------------------------------------------------------
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
