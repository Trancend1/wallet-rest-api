const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet-auth-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(tempDir, 'test.sqlite');
process.env.JWT_ACCESS_SECRET = 'test-access-secret-123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-123456789';

const { sequelize } = require('../src/models');
const { runMigrations } = require('../scripts/migrate');
const { app } = require('../src/app');

const user = {
  first_name: 'Guntur',
  last_name: 'Saputro',
  phone_number: '0811255501',
  address: 'Jl. Kebon Sirih No. 1',
  pin: '123456',
};

test.before(async () => runMigrations());
test.beforeEach(async () => sequelize.truncate({ cascade: true }));
test.after(async () => {
  await sequelize.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('register creates a user without exposing the PIN', async () => {
  const response = await request(app).post('/register').send(user);

  assert.equal(response.status, 201);
  assert.equal(response.body.status, 'SUCCESS');
  assert.equal(response.body.result.phone_number, user.phone_number);
  assert.equal(response.body.result.pin, undefined);
  assert.equal(response.body.result.pin_hash, undefined);
  assert.match(response.body.result.user_id, /^[0-9a-f-]{36}$/);
});

test('register rejects a duplicate phone number', async () => {
  await request(app).post('/register').send(user);
  const response = await request(app).post('/register').send(user);

  assert.equal(response.status, 409);
  assert.equal(response.body.message, 'Phone Number already registered');
});

test('login returns access and refresh tokens', async () => {
  await request(app).post('/register').send(user);
  const response = await request(app).post('/login').send({
    phone_number: user.phone_number,
    pin: user.pin,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'SUCCESS');
  assert.ok(response.body.result.access_token);
  assert.ok(response.body.result.refresh_token);
});

test('login rejects an incorrect PIN', async () => {
  await request(app).post('/register').send(user);
  const response = await request(app).post('/login').send({
    phone_number: user.phone_number,
    pin: '999999',
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Phone number and pin doesn't match.");
});

test('refresh returns a new access token', async () => {
  await request(app).post('/register').send(user);
  const login = await request(app).post('/login').send({
    phone_number: user.phone_number,
    pin: user.pin,
  });
  const response = await request(app).post('/refresh').send({
    refresh_token: login.body.result.refresh_token,
  });

  assert.equal(response.status, 200);
  assert.ok(response.body.result.access_token);
});

test('register rejects malformed input', async () => {
  const response = await request(app).post('/register').send({ ...user, pin: '12' });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Validation failed');
});
