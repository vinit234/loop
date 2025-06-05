const Batch = require('../models/batch');
const Ingestion = require('../models/ingestion');

class BatchProcessor {
  constructor() {
    this.processing = false;
    this.queue = [];
    this.startProcessing();
  }

  async addToQueue(batch) {
    this.queue.push(batch);
    this.queue.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.created_time - b.created_time;
    });
  }

  async processBatch(batch) {
    try {
   
      await Batch.findByIdAndUpdate(batch._id, { status: 'triggered' });
   
      await new Promise(resolve => setTimeout(resolve, 1000));
    
      await Batch.findByIdAndUpdate(batch._id, { status: 'completed' });
      
   
      const allBatches = await Batch.find({ ingestion_id: batch.ingestion_id });
      const allCompleted = allBatches.every(b => b.status === 'completed');
      
      if (allCompleted) {
        await Ingestion.findOneAndUpdate(
          { ingestion_id: batch.ingestion_id },
          { status: 'completed' }
        );
      }
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }

  async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      if (this.queue.length > 0) {
        const batch = this.queue.shift();
        await this.processBatch(batch);
      }
   
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
const batchProcessor = new BatchProcessor();
module.exports = batchProcessor; 