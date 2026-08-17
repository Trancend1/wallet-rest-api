const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet-api-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(tempDir, 'test.sqlite');
process.env.JWT_ACCESS_SECRET = 'test-access-secret-123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-123456789';

const { sequelize } = require('../src/models');
const { runMigrations } = require('../scripts/migrate');
const { app } = require('../src/app');

test.before(async () => runMigrations());
test.beforeEach(async () => sequelize.truncate({ cascade: true }));
test.after(async () => {
  await sequelize.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function createSession(phone = '081100000001') {
  await request(app).post('/register').send({
    first_name: 'Wallet', last_name: 'User', phone_number: phone,
    address: 'Jakarta', pin: '123456',
  });
  const login = await request(app).post('/login').send({ phone_number: phone, pin: '123456' });
  return login.body.result.access_token;
}

test('protected endpoint rejects a missing token', async () => {
  const response = await request(app).post('/topup').send({ amount: 1000 });
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Unauthenticated');
});

test('profile updates only editable fields', async () => {
  const token = await createSession();
  const response = await request(app).put('/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ first_name: 'Tom', last_name: 'Araya', address: 'Jl. Diponegoro No. 215' });

  assert.equal(response.status, 200);
  assert.equal(response.body.result.first_name, 'Tom');
  assert.equal(response.body.result.address, 'Jl. Diponegoro No. 215');

  const forbidden = await request(app).put('/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ first_name: 'Tom', last_name: 'Araya', address: 'Jakarta', phone_number: '0899' });
  assert.equal(forbidden.status, 400);
});

test('top up and payment atomically update balance and report', async () => {
  const token = await createSession();
  const topup = await request(app).post('/topup')
    .set('Authorization', `Bearer ${token}`).send({ amount: 500000 });
  assert.equal(topup.status, 201);
  assert.equal(topup.body.result.balance_before, 0);
  assert.equal(topup.body.result.balance_after, 500000);

  const pay = await request(app).post('/pay')
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 100000, remarks: 'Pulsa Telkomsel 100k' });
  assert.equal(pay.status, 201);
  assert.equal(pay.body.result.balance_before, 500000);
  assert.equal(pay.body.result.balance_after, 400000);

  const report = await request(app).get('/transactions')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(report.status, 200);
  assert.equal(report.body.result.length, 2);
  assert.equal(report.body.result[0].activity_type, 'PAYMENT');
  assert.equal(report.body.result[1].activity_type, 'TOP_UP');
});

test('payment rejects insufficient balance without creating history', async () => {
  const token = await createSession();
  const response = await request(app).post('/pay')
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 100000, remarks: 'Purchase' });

  assert.equal(response.status, 422);
  assert.equal(response.body.message, 'Balance is not enough');
  const report = await request(app).get('/transactions').set('Authorization', `Bearer ${token}`);
  assert.equal(report.body.result.length, 0);
});
