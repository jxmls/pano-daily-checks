// api/routes/submissions.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 🔹 GET: Fetch all submissions
router.get('/', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    console.error('❌ Failed to fetch submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// 🔹 POST: Create a new submission
router.post('/', async (req, res) => {
  const { date, engineer, solarwinds, vsan } = req.body;

  try {
    const submission = await prisma.submission.create({
      data: {
        date: new Date(date),
        engineer,
        solarClient: solarwinds?.client || '',
        solarAlert: solarwinds?.alert === 'yes',
        vsanClient: vsan?.client || '',
        vsanAlert: vsan?.alert === 'yes',
      },
    });

    res.status(201).json({ success: true, submission });
  } catch (err) {
    console.error('❌ Failed to create submission:', err);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

export default router;
