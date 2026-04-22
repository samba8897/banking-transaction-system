const request = require('supertest');
const pool = require('../src/config/db');
const app = require('../src/app');

describe('Transaction API', () => {
  let account1Id;
  let account2Id;

 beforeAll(async () => {
  const account1 = await request(app)
    .post('/api/v1/accounts')
    .send({
      accountHolderName: 'Sender User',
      openingBalance: 5000,
    });

  const account2 = await request(app)
    .post('/api/v1/accounts')
    .send({
      accountHolderName: 'Receiver User',
      openingBalance: 3000,
    });

  if (account1.statusCode !== 201) {
    throw new Error(`Account 1 creation failed: ${JSON.stringify(account1.body)}`);
  }

  if (account2.statusCode !== 201) {
    throw new Error(`Account 2 creation failed: ${JSON.stringify(account2.body)}`);
  }

  account1Id = account1.body.data.id;
  account2Id = account2.body.data.id;
 });

  afterAll(async () => {
    await pool.end();
  });

  test('should deposit money successfully', async () => {
    const response = await request(app)
      .post(`/api/v1/accounts/${account1Id}/deposit`)
      .send({
        amount: 1000,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.currentBalance).toBeGreaterThan(0);
  });

  test('should withdraw money successfully', async () => {
    const response = await request(app)
      .post(`/api/v1/accounts/${account1Id}/withdraw`)
      .send({
        amount: 500,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should fail withdrawal for insufficient balance', async () => {
    const response = await request(app)
      .post(`/api/v1/accounts/${account1Id}/withdraw`)
      .send({
        amount: 999999,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Insufficient balance');
  });

  test('should transfer money successfully', async () => {
    const response = await request(app)
      .post('/api/v1/transactions/transfer')
      .send({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: 700,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.transferredAmount).toBe(700);
  });

  test('should reject same-account transfer', async () => {
    const response = await request(app)
      .post('/api/v1/transactions/transfer')
      .send({
        fromAccountId: account1Id,
        toAccountId: account1Id,
        amount: 100,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Transfer to same account is not allowed');
  });

  test('should fetch transaction history', async () => {
    const response = await request(app).get(
      `/api/v1/accounts/${account1Id}/transactions`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.transactions)).toBe(true);
  });
});