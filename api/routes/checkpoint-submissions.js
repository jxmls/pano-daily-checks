// api/routes/checkpoint.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/checkpoint-submissions
router.post('/', async (req, res) => {
  try {
    const { date, engineer, panopticsAlertStatus, panopticsDetails, panopticsReference, panopticsAlerts, breweryAlertStatus, breweryDetails, breweryReference, breweryAlerts } = req.body;

    const submission = await prisma.checkpointSubmission.create({
      data: {
        date: new Date(date),
        engineer,
        panopticsAlertStatus,
        panopticsDetails,
        panopticsReference,
        breweryAlertStatus,
        breweryDetails,
        breweryReference,
        alerts: {
          create: [...panopticsAlerts, ...breweryAlerts]
        }
      },
      include: { alerts: true }
    });

    res.status(201).json(submission);
  } catch (err) {
    console.error('❌ Failed to submit checkpoint:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkpoint-submissions
router.get('/', async (req, res) => {
  try {
    const submissions = await prisma.checkpointSubmission.findMany({
      include: { alerts: true },
      orderBy: { date: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    console.error('❌ Failed to retrieve checkpoint submissions:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
d