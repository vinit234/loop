const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Ingestion = require('../models/ingestion');
const Batch = require('../models/batch');

describe('Data Ingestion API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/data-ingestion-test');
  });

  afterAll(async () => {
  
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {

    await Ingestion.deleteMany({});
    await Batch.deleteMany({});
  });

  describe('POST /ingest', () => {
    it('should create a new ingestion with valid input', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5],
          priority: 'HIGH'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingestion_id');
    });

    it('should validate ID range', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [0, 1e9 + 8],
          priority: 'HIGH'
        });

      expect(response.status).toBe(400);
    });

    it('should validate priority values', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'INVALID'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /status/:ingestion_id', () => {
    it('should return status for existing ingestion', async () => {
  
      const ingestion = await Ingestion.create({
        ingestion_id: 'test123',
        priority: 'HIGH',
        status: 'yet_to_start'
      });

      
      await Batch.create({
        batch_id: 'batch1',
        ingestion_id: 'test123',
        ids: [1, 2, 3],
        status: 'completed'
      });

      const response = await request(app)
        .get('/status/test123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingestion_id', 'test123');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('batches');
    });

    it('should return 404 for non-existent ingestion', async () => {
      const response = await request(app)
        .get('/status/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('Priority and Rate Limiting', () => {
    it('should process higher priority jobs first', async () => {

      const lowPriority = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'LOW'
        });

   
      const highPriority = await request(app)
        .post('/ingest')
        .send({
          ids: [4, 5, 6],
          priority: 'HIGH'
        });


      await new Promise(resolve => setTimeout(resolve, 1000));

      const lowStatus = await request(app)
        .get(`/status/${lowPriority.body.ingestion_id}`);

      const highStatus = await request(app)
        .get(`/status/${highPriority.body.ingestion_id}`);

      expect(highStatus.body.status).toBe('triggered');
      expect(lowStatus.body.status).toBe('yet_to_start');
    });

    it('should respect rate limit of 1 batch per 5 seconds', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5, 6],
          priority: 'HIGH'
        });

 
      const initialStatus = await request(app)
        .get(`/status/${response.body.ingestion_id}`);

      const triggeredBatches = initialStatus.body.batches.filter(
        batch => batch.status === 'triggered'
      );
      expect(triggeredBatches.length).toBeLessThanOrEqual(1);
    });
  });
}); 