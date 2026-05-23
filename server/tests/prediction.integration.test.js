const request = require('supertest');
const app = require('../src/app');
const cache = require('../src/shared/cache');

describe('Integration Test: Prediction Module', () => {
  beforeAll(() => {
    // Mock the shared cache data for the test
    cache.trainingData = {
      subjects: ['Math', 'Physics'],
      students: [
        { id: 'S1', scores: { 'Math': 8, 'Physics': 7 } },
        { id: 'S2', scores: { 'Math': 4, 'Physics': 5 } }
      ],
      curriculumOrder: ['Math', 'Physics']
    };
    
    cache.uploadedStudents = [
      { id: 'U1', scores: { 'Math': 9 } },
      { id: 'U2', scores: { 'Math': 3 } }
    ];

    cache.modelCache = {
      'Physics': {
        topFeatures: [{ feature: 'Math', hybridScore: 1.0, a: 0, b: 1 }]
      }
    };
  });

  it('GET /api/v1/prediction/:subject should return 200 and predictions', async () => {
    const res = await request(app).get('/api/v1/prediction/Physics');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.predictions).toBeDefined();
    expect(res.body.predictions).toHaveLength(2);
  });

  it('GET /api/v1/prediction/:subject with unknown subject should return 400', async () => {
    const res = await request(app).get('/api/v1/prediction/Chemistry');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
