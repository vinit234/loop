const express = require('express');
const router = express.Router();
const Ingestion = require('../models/ingestion');
const Batch = require('../models/batch');

router.get('/:ingestion_id', async (req, res) => {
  try {
    const { ingestion_id } = req.params;


    const ingestion = await Ingestion.findOne({ ingestion_id });
    if (!ingestion) {
      return res.status(404).json({ error: 'Ingestion not found' });
    }

    const batches = await Batch.find({ ingestion_id });

    let status = 'yet_to_start';
    if (batches.some(batch => batch.status === 'triggered')) {
      status = 'triggered';
    } else if (batches.every(batch => batch.status === 'completed')) {
      status = 'completed';
    }

    res.json({
      ingestion_id,
      status,
      batches: batches.map(batch => ({
        batch_id: batch.batch_id,
        ids: batch.ids,
        status: batch.status
      }))
    });
  } catch (error) {
    console.error('Error in status check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 