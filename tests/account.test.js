const request = require('supertest');
const pool = require('../src/config/db');
const app = require('../src/app');

describe('Account API', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('should create a new account', async () => {
    const response = await request(app)
      .post('/api/v1/accounts')
      .send({
        accountHolderName: 'Test User One',
        openingBalance: 2000,
      });


    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.account_holder_name).toBe('Test User One');
    expect(response.body.data.balance).toBe('2000.00');
  });

  test('should fetch account by id', async () => {
    const createResponse = await request(app)
      .post('/api/v1/accounts')
      .send({
        accountHolderName: 'Fetch User',
        openingBalance: 1000,
      });


    const accountId = createResponse.body.data.id;

    const response = await request(app).get(`/api/v1/accounts/${accountId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(accountId);
  });

  test('should reject negative opening balance', async () => {
    const response = await request(app)
      .post('/api/v1/accounts')
      .send({
        accountHolderName: 'Bad User',
        openingBalance: -500,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});