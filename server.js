// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import submissionsRouter from './api/routes/submissions.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API routes
app.use('/api/submissions', submissionsRouter);

// Serve static files from client build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// 🔹 API route: manual form submission
app.post('/api/submit', async (req, res) => {
  const { date, engineer, solarwinds, vsan } = req.body;
  try {
    const submission = await prisma.submission.create({
      data: {
        date: new Date(date),
        engineer,
        solarClient: solarwinds.client,
        solarAlert: solarwinds.alert === 'yes',
        vsanClient: vsan.client,
        vsanAlert: vsan.alert === 'yes',
      },
    });
    res.status(201).json({ success: true, submission });
  } catch (err) {
    console.error('❌ Failed to save submission:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 API route: get all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    console.error('❌ Failed to retrieve submissions:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Serve SolarWinds alerts from JSON
app.get('/api/solarwinds-alerts', (req, res) => {
  const filePath = path.join(__dirname, 'api', 'alerts', 'solarwinds.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Failed to read SolarWinds alert file:', err);
      return res.status(500).json({ error: 'Could not read alerts file' });
    }

    try {
      const cleanData = data.replace(/^\uFEFF/, ''); // Remove BOM
      const json = JSON.parse(cleanData);
      res.json(json);
    } catch (parseErr) {
      console.error('❌ JSON parse error:', parseErr.message);
      res.status(500).json({ error: 'Invalid JSON in alert file' });
    }
  });
});

// 🔸 Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
