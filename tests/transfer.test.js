const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet-transfer-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(tempDir, 'test.sqlite');
process.env.JWT_ACCESS_SECRET = 'test-access-secret-123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-123456789';

const { sequelize, User, WalletTransaction } = require('../src/models');
const { runMigrations } = require('../scripts/migrate');
const { app } = require('../src/app');
const { processNextTransfer } = require('../src/workers/transfer-worker');

test.before(async () => runMigrations());
test.beforeEach(async () => sequelize.truncate({ cascade: true }));
test.after(async () => {
  await sequelize.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function createSession(phone) {
  const registration = await request(app).post('/register').send({
    first_name: 'Transfer', last_name: 'User', phone_number: phone,
    address: 'Jakarta', pin: '123456',
  });
  const login = await request(app).post('/login').send({ phone_number: phone, pin: '123456' });
  return { userId: registration.body.result.user_id, token: login.body.result.access_token };
}

test('worker completes a queued transfer atomically for both users', async () => {
  const source = await createSession('081100000011');
  const target = await createSession('081100000012');
  await request(app).post('/topup').set('Authorization', `Bearer ${source.token}`).send({ amount: 100000 });

  const queued = await request(app).post('/transfer')
    .set('Authorization', `Bearer ${source.token}`)
    .send({ target_user: target.userId, amount: 30000, remarks: 'Hadiah Ultah' });
  assert.equal(queued.status, 202);
  assert.equal(queued.body.result.status, 'PENDING');

  await processNextTransfer();

  const status = await request(app).get(`/transfers/${queued.body.result.transfer_id}`)
    .set('Authorization', `Bearer ${source.token}`);
  assert.equal(status.body.result.status, 'SUCCESS');

  const sourceUser = await User.findByPk(source.userId);
  const targetUser = await User.findByPk(target.userId);
  assert.equal(sourceUser.balance, 70000);
  assert.equal(targetUser.balance, 30000);
  assert.equal(await WalletTransaction.count({ where: { activity_type: 'TRANSFER_OUT' } }), 1);
  assert.equal(await WalletTransaction.count({ where: { activity_type: 'TRANSFER_IN' } }), 1);

  const hidden = await request(app).get(`/transfers/${queued.body.result.transfer_id}`)
    .set('Authorization', `Bearer ${target.token}`);
  assert.equal(hidden.status, 404);
});

test('worker fails safely if balance disappears before processing', async () => {
  const source = await createSession('081100000021');
  const target = await createSession('081100000022');
  await request(app).post('/topup').set('Authorization', `Bearer ${source.token}`).send({ amount: 30000 });
  const queued = await request(app).post('/transfer')
    .set('Authorization', `Bearer ${source.token}`)
    .send({ target_user: target.userId, amount: 30000, remarks: 'Queued transfer' });

  await User.update({ balance: 0 }, { where: { user_id: source.userId } });
  await processNextTransfer();

  const status = await request(app).get(`/transfers/${queued.body.result.transfer_id}`)
    .set('Authorization', `Bearer ${source.token}`);
  assert.equal(status.body.result.status, 'FAILED');
  assert.equal((await User.findByPk(target.userId)).balance, 0);
  assert.equal(await WalletTransaction.count({ where: { reference_id: queued.body.result.transfer_id } }), 0);
});

test('transfer rejects self transfer and missing target', async () => {
  const source = await createSession('081100000031');
  const self = await request(app).post('/transfer').set('Authorization', `Bearer ${source.token}`)
    .send({ target_user: source.userId, amount: 100, remarks: 'Self' });
  assert.equal(self.status, 400);

  const missing = await request(app).post('/transfer').set('Authorization', `Bearer ${source.token}`)
    .send({ target_user: '6dcf44bb-b0a9-45fd-99c2-170a8510a84d', amount: 100, remarks: 'Missing' });
  assert.equal(missing.status, 404);
});
