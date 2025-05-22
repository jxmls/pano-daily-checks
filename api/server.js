// server.js
const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from client build
app.use(express.static(path.join(__dirname, "..", "client", "build")));

// API route
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
        vsanAlert: vsan.alert === "yes"
      }
    });
    res.status(201).json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View submissions
app.get("/api/submissions", async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({ orderBy: { date: "desc" } });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all to serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
