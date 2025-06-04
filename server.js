// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from client build
app.use(express.static(path.join(__dirname, "client", "build")));

// 🔹 API route: form submission
app.post("/api/submit", async (req, res) => {
  const { date, engineer, solarwinds, vsan } = req.body;
  try {
    const submission = await prisma.submission.create({
      data: {
        date: new Date(date),
        engineer,
        solarClient: solarwinds.client,
        solarAlert: solarwinds.alert === "yes",
        vsanClient: vsan.client,
        vsanAlert: vsan.alert === "yes",
      },
    });
    res.status(201).json({ success: true, submission });
  } catch (err) {
    console.error("❌ Failed to save submission:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 API route: get all submissions
app.get("/api/submissions", async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({ orderBy: { date: "desc" } });
    res.json(submissions);
  } catch (err) {
    console.error("❌ Failed to retrieve submissions:", err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ API route to serve SolarWinds alerts (with BOM fix)
app.get("/api/solarwinds-alerts", (req, res) => {
  const filePath = path.join(__dirname, "api", "alerts", "solarwinds.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Failed to read SolarWinds alert file:", err);
      return res.status(500).json({ error: "Could not read alerts file" });
    }

    // 🔍 Optional debug output
    console.log("🔍 Raw file contents:\n", data);

    try {
      // 🧼 Strip Byte Order Mark (BOM) if present
      const cleanData = data.replace(/^\uFEFF/, "");
      const json = JSON.parse(cleanData);
      res.json(json);
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr.message);
      res.status(500).json({ error: "Invalid JSON in alert file" });
    }
  });
});
// 🔸 Catch-all: serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
