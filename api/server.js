const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: '*', // or restrict to 'https://pano-daily-checks.vercel.app'
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// POST /submit
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
        vsanAlert: vsan.alert === 'yes'
      }
    });

    res.status(201).json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});