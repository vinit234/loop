const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Ingestion = require('../models/ingestion');
const Batch = require('../models/batch');
const batchProcessor = require('../services/batchProcessor');

router.post('/', async (req, res) => {
  try {
    const { ids, priority } = req.body;
    if (!ids || !Array.isArray(ids) || !priority || !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    if (!ids.every(id => Number.isInteger(id) && id >= 1 && id <= 1e9 + 7)) {
      return res.status(400).json({ error: 'Invalid ID range' });
    }

    const ingestion_id = uuidv4();
    const ingestion = new Ingestion({
      ingestion_id,
      priority,
      status: 'yet_to_start'
    });
    await ingestion.save();

    const batches = [];
    for (let i = 0; i < ids.length; i += 3) {
      const batchIds = ids.slice(i, i + 3);
      const batch = new Batch({
        batch_id: uuidv4(),
        ingestion_id,
        ids: batchIds,
        status: 'yet_to_start'
      });
      await batch.save();
      batches.push(batch);

      await batchProcessor.addToQueue({
        ...batch.toObject(),
        priority
      });
    }

    res.json({ ingestion_id });
  } catch (error) {
    console.error('Error in ingestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 